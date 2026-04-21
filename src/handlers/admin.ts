import type { Bot, CommandContext } from 'grammy';

import type { AppContext } from '../bot.js';
import { t } from '../i18n/index.js';
import {
  coerceLocale,
  LOCALE_NATIVE_NAMES,
  resolveLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from '../i18n/types.js';
import { formatLocalDayLabel, formatLocalTime, isValidIanaTz } from '../util/date.js';
import { logWarn } from '../util/log.js';

/**
 * Allowed range for the `vote_threshold` setting.
 */
const THRESHOLD_RANGE = { min: 1, max: 1000 } as const;

/**
 * Allowed range for the `daily_limit` setting.
 */
const LIMIT_RANGE = { min: 1, max: 50 } as const;

/**
 * Maximum preview length for the `digest_prefix` inside `/settings`.
 */
const PREFIX_PREVIEW_LEN = 80;

/**
 * Registers per-group admin commands: `/settings`, `/threshold`, `/limit`,
 * `/timezone` (alias `/tz`), `/prefix`, `/clearprefix`, `/language` (alias
 * `/lang`).
 *
 * The commands only respond in group/supergroup chats and require the issuing
 * user to be a creator or administrator of the chat.
 *
 * @param bot grammY bot to attach listeners to.
 */
export function registerAdminHandlers(bot: Bot<AppContext>): void {
  bot.command('settings', async (ctx) => {
    if (!(await ensureGroupAdmin(ctx))) {return;}

    const chatId = ctx.chat.id;
    const chatUsername = 'username' in ctx.chat ? (ctx.chat.username ?? null) : null;
    const group = await ctx.repo.upsertGroupMeta(chatId, chatUsername, ctx.chat.title ?? null);
    const locale = coerceLocale(group.language);
    const messages = t(locale);
    const prefixLine = renderPrefixPreview(group.digest_prefix, locale);
    await ctx.reply(
      messages.admin.settings({
        chatId: group.chat_id,
        tz: escapeHtml(group.tz),
        threshold: group.vote_threshold,
        limit: group.daily_limit,
        prefixPreview: prefixLine,
        languageLabel: LOCALE_NATIVE_NAMES[locale],
      }),
      { parse_mode: 'HTML', reply_parameters: { message_id: ctx.msg.message_id } },
    );
  });

  bot.command('threshold', async (ctx) => {
    if (!(await ensureGroupAdmin(ctx))) {return;}

    const locale = await resolveGroupLocale(ctx);
    const messages = t(locale);
    const value = parseIntArg(ctx.match);

    if (value === null || value < THRESHOLD_RANGE.min || value > THRESHOLD_RANGE.max) {
      await ctx.reply(messages.admin.thresholdUsage(THRESHOLD_RANGE.min, THRESHOLD_RANGE.max), {
        parse_mode: 'HTML',
        reply_parameters: { message_id: ctx.msg.message_id },
      });

      return;
    }

    await ctx.repo.setVoteThreshold(ctx.chat.id, value);
    await ctx.reply(messages.admin.thresholdOk(value), {
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  });

  bot.command('limit', async (ctx) => {
    if (!(await ensureGroupAdmin(ctx))) {return;}

    const locale = await resolveGroupLocale(ctx);
    const messages = t(locale);
    const value = parseIntArg(ctx.match);

    if (value === null || value < LIMIT_RANGE.min || value > LIMIT_RANGE.max) {
      await ctx.reply(messages.admin.limitUsage(LIMIT_RANGE.min, LIMIT_RANGE.max), {
        parse_mode: 'HTML',
        reply_parameters: { message_id: ctx.msg.message_id },
      });

      return;
    }

    await ctx.repo.setDailyLimit(ctx.chat.id, value);
    await ctx.reply(messages.admin.limitOk(value), {
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  });

  const timezoneHandler = async (ctx: CommandContext<AppContext>): Promise<void> => {
    if (!(await ensureGroupAdmin(ctx))) {return;}

    const chatId = ctx.chat.id;
    const chatUsername = 'username' in ctx.chat ? (ctx.chat.username ?? null) : null;
    const group = await ctx.repo.upsertGroupMeta(chatId, chatUsername, ctx.chat.title ?? null);
    const locale = coerceLocale(group.language);
    const messages = t(locale);
    const arg = (ctx.match ?? '').trim();

    if (arg.length === 0) {
      await ctx.reply(messages.admin.tzCurrent(escapeHtml(group.tz)), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_parameters: { message_id: ctx.msg.message_id },
      });

      return;
    }

    if (!isValidIanaTz(arg)) {
      await ctx.reply(messages.admin.tzInvalid(escapeHtml(arg)), {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_parameters: { message_id: ctx.msg.message_id },
      });

      return;
    }

    await ctx.repo.setGroupTz(chatId, arg);
    const nowIso = new Date().toISOString();
    const time = formatLocalTime(nowIso, arg);
    const day = formatLocalDayLabel(nowIso, arg, locale);
    await ctx.reply(messages.admin.tzOk(escapeHtml(arg), time, day), {
      parse_mode: 'HTML',
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  };

  bot.command('timezone', timezoneHandler);
  bot.command('tz', timezoneHandler);

  const languageHandler = async (ctx: CommandContext<AppContext>): Promise<void> => {
    if (!(await ensureGroupAdmin(ctx))) {return;}

    const chatId = ctx.chat.id;
    const chatUsername = 'username' in ctx.chat ? (ctx.chat.username ?? null) : null;
    const group = await ctx.repo.upsertGroupMeta(chatId, chatUsername, ctx.chat.title ?? null);
    const currentLocale = coerceLocale(group.language);
    const currentMessages = t(currentLocale);
    const optionsText = renderLocaleOptions();
    const arg = (ctx.match ?? '').trim();

    if (arg.length === 0) {
      await ctx.reply(
        currentMessages.admin.languageUsage(LOCALE_NATIVE_NAMES[currentLocale], optionsText),
        {
          parse_mode: 'HTML',
          reply_parameters: { message_id: ctx.msg.message_id },
        },
      );

      return;
    }

    const next = resolveLocale(arg);

    if (!next) {
      await ctx.reply(currentMessages.admin.languageInvalid(escapeHtml(arg), optionsText), {
        parse_mode: 'HTML',
        reply_parameters: { message_id: ctx.msg.message_id },
      });

      return;
    }

    await ctx.repo.setGroupLanguage(chatId, next);
    await ctx.reply(t(next).admin.languageOk(LOCALE_NATIVE_NAMES[next]), {
      parse_mode: 'HTML',
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  };

  bot.command('language', languageHandler);
  bot.command('lang', languageHandler);

  bot.command('prefix', async (ctx) => {
    if (!(await ensureGroupAdmin(ctx))) {return;}

    const chatId = ctx.chat.id;
    const chatUsername = 'username' in ctx.chat ? (ctx.chat.username ?? null) : null;
    const group = await ctx.repo.upsertGroupMeta(chatId, chatUsername, ctx.chat.title ?? null);
    const locale = coerceLocale(group.language);
    const messages = t(locale);

    await ctx.repo.putPendingDraft(ctx.from!.id, {
      kind: 'prefix',
      groupChatId: chatId,
      creatorId: ctx.from!.id,
      tz: group.tz,
      locale,
    });

    const me = await ctx.api.getMe();
    const deepLink = `https://t.me/${me.username}?start=prefix`;
    await ctx.reply(messages.admin.prefixAskDm, {
      reply_parameters: { message_id: ctx.msg.message_id },
      reply_markup: {
        inline_keyboard: [[{ text: messages.mention.openDmButton, url: deepLink }]],
      },
    });
  });

  bot.command('clearprefix', async (ctx) => {
    if (!(await ensureGroupAdmin(ctx))) {return;}

    const locale = await resolveGroupLocale(ctx);
    const messages = t(locale);
    await ctx.repo.setDigestPrefix(ctx.chat.id, null);
    await ctx.reply(messages.admin.clearPrefixOk, {
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  });
}

/**
 * Loads the group's configured locale for a command context, falling back to
 * the default locale when the group has no row yet.
 *
 * @param ctx Command context.
 * @returns Validated locale.
 */
async function resolveGroupLocale(ctx: CommandContext<AppContext>): Promise<Locale> {
  const group = await ctx.repo.getGroup(ctx.chat.id);

  return coerceLocale(group?.language);
}

/**
 * Renders the list of supported locales as a comma-separated
 * `code (Native Name)` string for help messages.
 *
 * @returns Comma-joined list, e.g. `en (English), de (Deutsch), …`.
 */
function renderLocaleOptions(): string {
  return SUPPORTED_LOCALES.map(
    (code) => `<code>${code}</code> (${LOCALE_NATIVE_NAMES[code]})`,
  ).join(', ');
}

/**
 * Guards a command handler: ensures it was issued in a group chat by an admin
 * and replies with a user-facing hint otherwise.
 *
 * @param ctx Command context.
 * @returns `true` if the handler may proceed.
 */
async function ensureGroupAdmin(ctx: CommandContext<AppContext>): Promise<boolean> {
  const chat = ctx.chat;
  const user = ctx.from;

  if (!chat || !user) {return false;}

  if (chat.type !== 'group' && chat.type !== 'supergroup') {
    await ctx.reply(t(coerceLocale(null)).admin.onlyGroup);

    return false;
  }

  const locale = await resolveGroupLocale(ctx);
  const messages = t(locale);
  try {
    const member = await ctx.api.getChatMember(chat.id, user.id);

    if (member.status !== 'creator' && member.status !== 'administrator') {
      await ctx.reply(messages.admin.onlyAdmin, {
        reply_parameters: { message_id: ctx.msg.message_id },
      });

      return false;
    }
  } catch (err) {
    logWarn('admin.getChatMember', err, { chatId: chat.id, userId: user.id });
    await ctx.reply(messages.admin.checkFailed);

    return false;
  }

  return true;
}

/**
 * Parses the command argument into a strictly positive integer.
 *
 * @param raw Raw `ctx.match` text.
 * @returns Parsed integer or `null` when the input is not a valid integer.
 */
function parseIntArg(raw: string | undefined): number | null {
  if (!raw) {return null;}

  const trimmed = raw.trim();

  if (!/^-?\d+$/.test(trimmed)) {return null;}

  const n = Number(trimmed);

  if (!Number.isInteger(n)) {return null;}

  return n;
}

/**
 * Renders a short preview of the configured digest prefix for `/settings`.
 *
 * @param html Stored prefix HTML or `null`.
 * @param locale UI locale used for the preview labels.
 * @returns Human-readable summary such as `нет` or `задан, 42 симв (<code>...</code>)`.
 */
function renderPrefixPreview(html: string | null, locale: Locale): string {
  const messages = t(locale);

  if (!html || html.trim().length === 0) {return messages.admin.prefixPreviewNone;}

  const plain = stripTags(html).replace(/\s+/g, ' ').trim();
  const snippet =
    plain.length <= PREFIX_PREVIEW_LEN ? plain : `${plain.slice(0, PREFIX_PREVIEW_LEN)}…`;

  return messages.admin.prefixPreviewSet(html.length, escapeHtml(snippet));
}

/**
 * Strips HTML tags from a string, leaving only the textual content.
 *
 * @param html HTML snippet.
 * @returns Plain-text approximation.
 */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escapes a value for Telegram `parse_mode: "HTML"`. Local copy so this
 * module doesn't depend on the rendering layer.
 *
 * @param input Raw string.
 * @returns HTML-safe text.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
