import type { Conversation, ConversationBuilder } from '@grammyjs/conversations';
import { InlineKeyboard, type Bot, type Context } from 'grammy';

import type { AppContext } from '../bot.js';
import { Repo } from '../db/repo.js';
import type { Env } from '../env.js';
import { t } from '../i18n/index.js';
import { coerceLocale, type Locale } from '../i18n/types.js';
import type { EventDraft, EventRow, PrefixDraft } from '../types.js';
import { INPUT_FORMAT, parseLocalDate, weekBounds } from '../util/date.js';
import { entitiesToHtml, type InputEntity } from '../util/entities.js';
import { renderEventCard, renderVoteButtonLabels, renderWeeklyDigest } from '../util/render.js';

/**
 * Identifier used to register and enter the event-submission conversation.
 */
export const EVENT_CONVERSATION_ID = 'eventConversation';

/**
 * Identifier used to register and enter the digest-prefix editor conversation.
 */
export const PREFIX_CONVERSATION_ID = 'prefixConversation';

/**
 * Maximum accepted length of a title or place entry.
 */
const MAX_FIELD_LEN = 200;

/**
 * Maximum accepted length of the raw digest prefix text (pre-HTML conversion).
 */
const MAX_PREFIX_LEN = 1500;

/**
 * Event-conversation builder factory.
 *
 * The factory closes over {@link Env} so the inner builder can talk to D1
 * via {@link Repo} through `conversation.external` calls while remaining
 * deterministic across replays.
 *
 * @param env Worker environment captured from the surrounding request.
 * @returns A conversation builder compatible with `createConversation`.
 */
export function buildEventConversation(env: Env): ConversationBuilder<AppContext, Context> {
  return async function eventConversation(
    conversation: Conversation<AppContext, Context>,
    ctx: Context,
    draftArg?: EventDraft,
  ): Promise<void> {
    const draft = draftArg ?? null;
    const locale: Locale = coerceLocale(draft?.locale);
    const messages = t(locale);

    if (!draft) {
      await ctx.reply(messages.event.noDraft);

      return;
    }

    const datetimeUtc = await resolveInitialDateTime(conversation, ctx, draft, locale);

    await ctx.reply(messages.event.askTitle);
    const title = await askNonEmpty(conversation, messages.event.titleEmpty);

    await ctx.reply(messages.event.askCity);
    const city = await askNonEmpty(conversation, messages.event.cityEmpty);

    await ctx.reply(messages.event.askPlace);
    const place = await askNonEmpty(conversation, messages.event.placeEmpty);

    const eventId = await conversation.external(() => crypto.randomUUID());

    await conversation.external(async () => {
      const repo = new Repo(env.DB);
      const row: EventRow = {
        id: eventId,
        group_chat_id: draft.groupChatId,
        creator_id: draft.creatorId,
        original_message_id: draft.originalMessageId,
        title,
        city,
        place,
        datetime_utc: datetimeUtc,
        status: 'pending',
        vote_message_id: null,
        votes_up: 0,
        votes_down: 0,
        created_at: new Date().toISOString(),
      };
      await repo.insertEvent(row);

      const kb = voteKeyboard(eventId, 0, 0);
      const sent = await ctx.api.sendMessage(
        draft.groupChatId,
        renderEventCard(row, draft.tz, locale, draft.groupUsername),
        {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
          reply_parameters: {
            message_id: draft.originalMessageId,
            allow_sending_without_reply: true,
          },
          reply_markup: kb,
        },
      );
      await repo.setVoteMessageId(eventId, sent.message_id);
    });

    await ctx.reply(messages.event.published);
  };
}

/**
 * Prefix-conversation builder factory.
 *
 * Asks the admin to send the message that will appear above the weekly
 * schedule in the pinned digest. Any Telegram text formatting present in
 * the message (bold, italic, underline, strike, spoiler, code, pre, links,
 * blockquote) is preserved via entity-to-HTML conversion.
 *
 * @param env Worker environment captured from the surrounding request.
 * @returns A conversation builder compatible with `createConversation`.
 */
export function buildPrefixConversation(env: Env): ConversationBuilder<AppContext, Context> {
  return async function prefixConversation(
    conversation: Conversation<AppContext, Context>,
    ctx: Context,
    draftArg?: PrefixDraft,
  ): Promise<void> {
    const draft = draftArg ?? null;
    const locale: Locale = coerceLocale(draft?.locale);
    const messages = t(locale);

    if (!draft) {
      await ctx.reply(messages.prefix.noDraft);

      return;
    }

    await ctx.reply(messages.prefix.ask(MAX_PREFIX_LEN));

    for (;;) {
      const msg = await conversation.waitFor(':text');
      const text = msg.msg.text;

      if (text.trim() === '/cancel') {
        await msg.reply(messages.prefix.cancelled);

        return;
      }

      if (text.length > MAX_PREFIX_LEN) {
        await msg.reply(messages.prefix.tooLong(text.length, MAX_PREFIX_LEN));
        continue;
      }

      if (text.trim().length === 0) {
        await msg.reply(messages.prefix.empty);
        continue;
      }

      const entities = msg.msg.entities as InputEntity[] | undefined;
      const html = entitiesToHtml(text, entities);

      const saved = await conversation.external(async (): Promise<boolean> => {
        const repo = new Repo(env.DB);
        await repo.setDigestPrefix(draft.groupChatId, html);

        return true;
      });

      if (!saved) {
        await msg.reply(messages.prefix.saveFailed);

        return;
      }

      const { startUtc, endUtc } = weekBounds(draft.tz);
      const preview = renderWeeklyDigest([], startUtc, endUtc, draft.tz, locale, html);
      await msg.reply(messages.prefix.saved);
      await msg.reply(preview, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });
      await msg.reply(messages.prefix.howToChange);

      return;
    }
  };
}

/**
 * Registers the "first DM after a mention / /prefix" kickoff middleware.
 *
 * When the user writes to the bot in DM and there is a pending draft stored
 * for them, the middleware inspects the draft kind and enters the matching
 * conversation. The `/start event` deep-link from the group fits here
 * transparently because it is just another DM message.
 *
 * @param bot grammY bot to attach listeners to.
 */
export function registerDmKickoff(bot: Bot<AppContext>): void {
  bot.on('message', async (ctx, next) => {
    if (ctx.chat?.type !== 'private' || !ctx.from) {
      return next();
    }

    if (
      ctx.conversation.active(EVENT_CONVERSATION_ID) > 0 ||
      ctx.conversation.active(PREFIX_CONVERSATION_ID) > 0
    ) {
      return next();
    }

    const draft = await ctx.repo.takePendingDraft(ctx.from.id);

    if (!draft) {
      if (ctx.message?.text?.startsWith('/start')) {
        await ctx.reply(t(coerceLocale(null)).start.welcome);

        return;
      }

      return next();
    }

    if (draft.kind === 'event') {
      const payload: EventDraft = {
        originalChatId: draft.originalChatId,
        originalMessageId: draft.originalMessageId,
        groupChatId: draft.groupChatId,
        groupUsername: draft.groupUsername,
        creatorId: draft.creatorId,
        tz: draft.tz,
        locale: draft.locale,
        ...(draft.primed ? { primed: true } : {}),
      };
      await ctx.conversation.enter(EVENT_CONVERSATION_ID, payload);

      return;
    }

    const prefixPayload: PrefixDraft = {
      groupChatId: draft.groupChatId,
      creatorId: draft.creatorId,
      tz: draft.tz,
      locale: draft.locale,
    };
    await ctx.conversation.enter(PREFIX_CONVERSATION_ID, prefixPayload);
  });
}

/**
 * Renders the inline keyboard for a voting card with current tallies.
 *
 * @param eventId Event identifier embedded into the callback data.
 * @param up Current up-vote count.
 * @param down Current down-vote count.
 * @returns Telegram `InlineKeyboard` with two buttons.
 */
export function voteKeyboard(eventId: string, up: number, down: number): InlineKeyboard {
  const { upLabel, downLabel } = renderVoteButtonLabels(up, down);

  return new InlineKeyboard().text(upLabel, `v:u:${eventId}`).text(downLabel, `v:d:${eventId}`);
}

/**
 * Resolves the very first piece of data for the event flow — the date/time.
 *
 * grammY conversations v2 consumes the update that triggered
 * `ctx.conversation.enter(...)` via an implicit initial wait, so the builder
 * always receives the first update as `ctx`. When the mention handler has
 * already asked for the date in DM (`draft.primed`), that first message *is*
 * the user's date answer — calling `askDateTime` straight away would wait for
 * a second message and effectively drop the input. To avoid that, parse the
 * primed message inline and only fall back to the standard
 * ask-and-retry loop on a bad first reply.
 *
 * @param conversation Active conversation handle.
 * @param ctx First update's context (also the primed reply when `primed`).
 * @param draft Conversation draft containing the `primed` flag and timezone.
 * @param locale UI locale for the prompts.
 * @returns ISO UTC datetime string.
 */
async function resolveInitialDateTime(
  conversation: Conversation<AppContext, Context>,
  ctx: Context,
  draft: EventDraft,
  locale: Locale,
): Promise<string> {
  const messages = t(locale);

  if (draft.primed) {
    const primedText = ctx.message?.text?.trim();
    const parsed = primedText ? parseLocalDate(primedText, draft.tz) : null;

    if (parsed) {
      return parsed;
    }

    await ctx.reply(messages.event.invalidDate(INPUT_FORMAT), {
      parse_mode: 'HTML',
    });

    return askDateTime(conversation, draft.tz, locale);
  }

  await ctx.reply(messages.event.askDate(INPUT_FORMAT), {
    parse_mode: 'HTML',
  });

  return askDateTime(conversation, draft.tz, locale);
}

/**
 * Repeatedly asks for a valid datetime until the user provides one.
 *
 * @param conversation Active conversation handle.
 * @param tz IANA timezone the date string is interpreted in.
 * @param locale UI locale for the error message.
 * @returns ISO UTC datetime string.
 */
async function askDateTime(
  conversation: Conversation<AppContext, Context>,
  tz: string,
  locale: Locale,
): Promise<string> {
  const messages = t(locale);

  for (;;) {
    const msg = await conversation.waitFor(':text');
    const text = msg.msg.text;
    const parsed = parseLocalDate(text, tz);

    if (parsed) {
      return parsed;
    }

    await msg.reply(messages.event.invalidDate(INPUT_FORMAT), {
      parse_mode: 'HTML',
    });
  }
}

/**
 * Repeatedly waits for a non-empty text message, trimming and truncating it.
 *
 * @param conversation Active conversation handle.
 * @param errorText Message to reply when the input is invalid.
 * @returns Cleaned value ready to persist.
 */
async function askNonEmpty(
  conversation: Conversation<AppContext, Context>,
  errorText: string,
): Promise<string> {
  for (;;) {
    const msg = await conversation.waitFor(':text');
    const value = msg.msg.text.trim().slice(0, MAX_FIELD_LEN);

    if (value.length > 0) {
      return value;
    }

    await msg.reply(errorText);
  }
}

