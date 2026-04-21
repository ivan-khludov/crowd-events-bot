import { InlineKeyboard, type Bot } from 'grammy';

import type { AppContext } from '../bot.js';
import { t } from '../i18n/index.js';
import { coerceLocale } from '../i18n/types.js';
import { startOfDayUtcIso } from '../util/date.js';

/**
 * Attaches the "user mentions the bot as a reply to a post" trigger.
 *
 * When a mention is detected the handler:
 *
 * 1. Ensures the group is tracked in `groups` and picks up its `daily_limit`.
 * 2. Counts events submitted by this user today (MSK) and rejects further ones
 *    if the limit is reached.
 * 3. Stores a {@link ../types.js#EventDraft} keyed by the user id and tries to
 *    nudge them in DM. If DMs are closed, replies in the group instead.
 *
 * @param bot grammY bot to attach listeners to.
 */
export function registerMentionHandler(bot: Bot<AppContext>): void {
  bot.on('message', async (ctx, next) => {
    const msg = ctx.message;
    const user = ctx.from;
    const chat = ctx.chat;

    if (!msg || !user || !chat) {
      return next();
    }

    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return next();
    }

    const reply = msg.reply_to_message;

    if (!reply) {
      return next();
    }

    const text = msg.text ?? msg.caption;

    if (!text) {
      return next();
    }

    const me = await ctx.api.getMe();
    const botUsername = me.username;

    if (!botUsername) {
      return next();
    }

    const lc = text.toLowerCase();
    const needle = `@${botUsername.toLowerCase()}`;

    if (!lc.includes(needle)) {
      return next();
    }

    const groupUsername = chat.type === 'supergroup' && 'username' in chat ? chat.username : null;
    const group = await ctx.repo.upsertGroupMeta(
      chat.id,
      groupUsername ?? null,
      chat.title ?? null,
    );
    const locale = coerceLocale(group.language);
    const messages = t(locale);

    const since = startOfDayUtcIso(group.tz);
    const submittedToday = await ctx.repo.countEventsByUserSince(user.id, since);

    if (submittedToday >= group.daily_limit) {
      await ctx.reply(messages.mention.limitReached(group.daily_limit), {
        reply_parameters: { message_id: msg.message_id },
      });

      return;
    }

    await ctx.repo.putPendingDraft(user.id, {
      kind: 'event',
      originalChatId: chat.id,
      originalMessageId: reply.message_id,
      groupChatId: chat.id,
      groupUsername: groupUsername ?? null,
      creatorId: user.id,
      tz: group.tz,
      locale,
    });

    const deepLink = `https://t.me/${botUsername}?start=event`;
    const kb = new InlineKeyboard().url(messages.mention.openDmButton, deepLink);
    await ctx.reply(messages.mention.invite(user.first_name), {
      reply_parameters: { message_id: msg.message_id },
      reply_markup: kb,
    });
  });
}
