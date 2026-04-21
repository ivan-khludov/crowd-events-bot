import type { Bot } from 'grammy';

import type { AppContext } from '../bot.js';
import { t } from '../i18n/index.js';
import { coerceLocale } from '../i18n/types.js';
import { logWarn } from '../util/log.js';
import { renderEventCard } from '../util/render.js';
import { voteKeyboard } from './conversation.js';

/**
 * Matches callback data of the form `v:u:<id>` / `v:d:<id>`.
 */
const CALLBACK_RE = /^v:(u|d):(.+)$/;

/**
 * Attaches the inline voting callback handler.
 *
 * Each tap writes (or replaces) the user's vote, recomputes the tallies in D1,
 * promotes the event to `approved` when the configured threshold is met,
 * and refreshes the message text plus inline keyboard with the new counters.
 *
 * @param bot grammY bot to attach listeners to.
 */
export function registerVoteHandler(bot: Bot<AppContext>): void {
  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const match = CALLBACK_RE.exec(data);

    if (!match) {
      return next();
    }

    const type = match[1] === 'u' ? 'up' : 'down';
    const eventId = match[2];

    if (!eventId) {
      await ctx.answerCallbackQuery();

      return;
    }

    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.answerCallbackQuery({ text: t(coerceLocale(null)).vote.unknownUser });

      return;
    }

    const result = await ctx.repo.castVote(eventId, userId, type);

    if (!result) {
      await ctx.answerCallbackQuery({ text: t(coerceLocale(null)).vote.eventNotFound });

      return;
    }

    const group = await ctx.repo.getGroup(result.groupChatId);
    const threshold = group?.vote_threshold ?? 10;
    const tz = group?.tz ?? 'Europe/Moscow';
    const locale = coerceLocale(group?.language);
    const messages = t(locale);

    let promoted = false;

    if (result.status === 'pending' && result.up >= threshold && result.up > result.down) {
      promoted = await ctx.repo.approveEvent(eventId);
    }

    const fresh = await ctx.repo.getEvent(eventId);

    if (fresh && fresh.vote_message_id !== null) {
      const kb = voteKeyboard(eventId, fresh.votes_up, fresh.votes_down);
      try {
        await ctx.api.editMessageText(
          fresh.group_chat_id,
          fresh.vote_message_id,
          renderEventCard(fresh, tz, locale, group?.username ?? null),
          {
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: kb,
          },
        );
      } catch (err) {
        logWarn('vote.editCard', err, {
          chatId: fresh.group_chat_id,
          messageId: fresh.vote_message_id,
          eventId,
        });
      }
    }

    const toast = promoted ? messages.vote.approved : messages.vote.recorded;
    await ctx.answerCallbackQuery({ text: toast });
  });
}
