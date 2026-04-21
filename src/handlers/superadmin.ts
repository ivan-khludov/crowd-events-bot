import type { Bot } from 'grammy';

import type { AppContext } from '../bot.js';
import { logWarn } from '../util/log.js';
import { parseSuperadminIds } from '../util/superadmin.js';

/**
 * Registers bot-wide guards and DM commands reserved for superadmins.
 *
 * Three concerns live here, intentionally co-located because they share the
 * `allowed_chats` state:
 *
 * 1. The `my_chat_member` listener — when the bot is added to (or promoted in)
 *    a group that is not on the allowlist, it leaves the chat immediately and
 *    DMs every configured superadmin with the chat id and the adder, so one
 *    `/allow <id>` command finishes onboarding.
 * 2. An allowlist guard middleware — for every subsequent update in a
 *    group/supergroup that is not on the allowlist, the bot silently leaves
 *    and drops the update before it reaches the conversations middleware or
 *    any downstream handler. This protects Free-plan Worker/D1 budget.
 * 3. Superadmin DM commands (`/allow`, `/disallow`, `/allowed`, `/whereami`)
 *    that mutate and inspect the allowlist. Non-superadmin users get no reply.
 *
 * Must be wired in {@link ../bot.js#createBot} AFTER the `ctx.repo`/`ctx.env`
 * decorator middleware and BEFORE the `conversations` middleware so that
 * disallowed updates never touch the `sessions` table.
 *
 * @param bot grammY bot to attach listeners to.
 */
export function registerSuperadminHandlers(bot: Bot<AppContext>): void {
  bot.on('my_chat_member', async (ctx, next) => {
    const upd = ctx.myChatMember;
    const chat = upd.chat;

    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return next();
    }

    const newStatus = upd.new_chat_member.status;
    const botIsInside = newStatus === 'member' || newStatus === 'administrator';

    if (!botIsInside) {
      return;
    }

    if (await ctx.repo.isAllowedChat(chat.id)) {
      return next();
    }

    try {
      await ctx.leaveChat();
    } catch (err) {
      logWarn('superadmin.leaveOnAdd', err, { chatId: chat.id });
    }

    const chatTitle = 'title' in chat ? (chat.title ?? '(untitled)') : '(untitled)';
    const adder = upd.from;
    const adderLabel = adder.username ? `@${adder.username}` : `id=${adder.id}`;
    const text =
      `Left non-allowlisted chat "${chatTitle}" (chat_id=${chat.id}), ` +
      `added/changed by ${adderLabel} (user_id=${adder.id}).\n` +
      `Reply with: /allow ${chat.id} ${chatTitle}`;

    await notifySuperadmins(ctx, text);
  });

  bot.use(async (ctx, next) => {
    const chat = ctx.chat;

    if (!chat) {
      return next();
    }

    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return next();
    }

    if (await ctx.repo.isAllowedChat(chat.id)) {
      return next();
    }

    try {
      await ctx.leaveChat();
    } catch (err) {
      logWarn('superadmin.leaveOnUpdate', err, { chatId: chat.id });
    }
  });

  bot.command('allow', async (ctx) => {
    if (!isSuperadminDm(ctx)) {
      return;
    }

    const parsed = parseAllowArgs(ctx.match);

    if (!parsed) {
      await ctx.reply(
        'Usage: /allow <chat_id> [note]\n' +
          'chat_id must be a negative integer (groups/supergroups).',
      );

      return;
    }

    const { chatId, note } = parsed;
    await ctx.repo.addAllowedChat(chatId, ctx.from!.id, note);
    await ctx.reply(`OK: chat ${chatId} allowed. Add the bot to the group as admin; it will stay.`);
  });

  bot.command('disallow', async (ctx) => {
    if (!isSuperadminDm(ctx)) {
      return;
    }

    const chatId = parseChatIdArg(ctx.match);

    if (chatId === null) {
      await ctx.reply('Usage: /disallow <chat_id>');

      return;
    }

    const removed = await ctx.repo.removeAllowedChat(chatId);

    try {
      await ctx.api.leaveChat(chatId);
    } catch (err) {
      logWarn('superadmin.disallowLeave', err, { chatId });
    }

    await ctx.reply(
      removed ? `OK: chat ${chatId} removed from allowlist.` : `No allowlist entry for ${chatId}.`,
    );
  });

  bot.command('allowed', async (ctx) => {
    if (!isSuperadminDm(ctx)) {
      return;
    }

    const rows = await ctx.repo.listAllowedChats();

    if (rows.length === 0) {
      await ctx.reply('Allowlist is empty.');

      return;
    }

    const lines = rows.map((row) => {
      const note = row.note ? ` — ${row.note}` : '';

      return `${row.chat_id}  (by ${row.added_by}, ${row.created_at})${note}`;
    });
    await ctx.reply(`Allowlist (${rows.length}):\n${lines.join('\n')}`);
  });

  bot.command('whereami', async (ctx) => {
    if (!isSuperadminDm(ctx)) {
      return;
    }

    const chatId = parseChatIdArg(ctx.match);

    if (chatId === null) {
      await ctx.reply('Usage: /whereami <chat_id>');

      return;
    }

    try {
      const info = await ctx.api.getChat(chatId);
      const title = 'title' in info ? info.title : '(no title)';
      const username = 'username' in info && info.username ? `@${info.username}` : '(no username)';
      const allowed = await ctx.repo.isAllowedChat(chatId);
      await ctx.reply(
        `chat_id: ${chatId}\n` +
          `type:    ${info.type}\n` +
          `title:   ${title}\n` +
          `user:    ${username}\n` +
          `allowed: ${allowed ? 'yes' : 'no'}`,
      );
    } catch (err) {
      logWarn('superadmin.whereami', err, { chatId });
      await ctx.reply(`Could not fetch chat ${chatId}: ${describeError(err)}`);
    }
  });
}

/**
 * Checks that a command context originates from a private chat with a
 * superadmin user. Used to silently ignore any other invocation.
 *
 * @param ctx grammY context of a command update.
 * @returns `true` if the command may proceed.
 */
function isSuperadminDm(ctx: AppContext): boolean {
  if (ctx.chat?.type !== 'private') {
    return false;
  }

  return parseSuperadminIds(ctx.env).has(ctx.from?.id ?? 0);
}

/**
 * Parses the argument of `/allow` into a chat id and an optional note.
 *
 * @param raw Raw `ctx.match` text (everything after the command name).
 * @returns Parsed payload or `null` when the chat id is missing or invalid.
 */
function parseAllowArgs(raw: string | undefined): { chatId: number; note: string | null } | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const firstSpace = trimmed.search(/\s/);
  const idPart = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
  const notePart = firstSpace === -1 ? '' : trimmed.slice(firstSpace).trim();

  const chatId = parseChatIdArg(idPart);

  if (chatId === null) {
    return null;
  }

  return { chatId, note: notePart.length > 0 ? notePart : null };
}

/**
 * Parses a chat id argument. Accepts any non-zero integer; Telegram uses
 * negative ids for groups/supergroups and positive for users/bots.
 *
 * @param raw Raw argument text.
 * @returns Parsed integer chat id or `null`.
 */
function parseChatIdArg(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();

  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }

  const n = Number(trimmed);

  if (!Number.isInteger(n) || n === 0) {
    return null;
  }

  return n;
}

/**
 * Sends a plain-text notification to every configured superadmin. Individual
 * send failures are swallowed so one blocked DM does not drop the others.
 *
 * @param ctx grammY context whose `api` is used to send messages.
 * @param text Pre-formatted message body.
 */
async function notifySuperadmins(ctx: AppContext, text: string): Promise<void> {
  for (const id of parseSuperadminIds(ctx.env)) {
    try {
      await ctx.api.sendMessage(id, text);
    } catch (err) {
      logWarn('superadmin.notify', err, { userId: id });
    }
  }
}

/**
 * Renders an unknown thrown value as a short human-readable string for DM
 * replies that need a best-effort error description.
 *
 * @param err Thrown value.
 * @returns Short description (never longer than ~200 chars).
 */
function describeError(err: unknown): string {
  if (err instanceof Error) {
    return err.message.slice(0, 200);
  }

  return String(err).slice(0, 200);
}
