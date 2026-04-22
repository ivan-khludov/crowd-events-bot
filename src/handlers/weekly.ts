import { Api } from 'grammy';

import { Repo } from '../db/repo.js';
import type { Env } from '../env.js';
import { coerceLocale } from '../i18n/types.js';
import type { GroupRow } from '../types.js';
import { weekBounds } from '../util/date.js';
import { logError, logWarn } from '../util/log.js';
import { renderWeeklyDigest } from '../util/render.js';

/**
 * Recomputes and publishes the weekly pinned digest for every known group.
 *
 * For each group the function:
 *
 * 1. Resolves the current local-week `[startUtc, endUtc)` window using the
 *    group's configured `tz`.
 * 2. Selects all approved events that fall inside the window.
 * 3. Renders a digest post (optionally prefixed with the group's
 *    `digest_prefix`) and either edits the currently pinned message (same
 *    week) or posts a fresh one and pins it (new week or no pin).
 *
 * The function is intentionally idempotent and safe to run every cron tick.
 *
 * @param env Worker environment with D1 and bot credentials.
 */
export async function runWeeklyDigest(env: Env): Promise<void> {
  const api = new Api(env.BOT_TOKEN);
  const repo = new Repo(env.DB);
  const groups = await repo.listGroups();

  for (const group of groups) {
    try {
      await refreshGroupDigest(api, repo, group);
    } catch (err) {
      logError('weekly.group', err, { chatId: group.chat_id });
    }
  }
}

/**
 * Refreshes or creates the weekly digest for a single group.
 *
 * @param api grammY Bot API client.
 * @param repo Database access layer.
 * @param group Group row pre-loaded by the outer loop.
 */
async function refreshGroupDigest(api: Api, repo: Repo, group: GroupRow): Promise<void> {
  const chatId = group.chat_id;
  const { startUtc, endUtc } = weekBounds(group.tz);

  const events = await repo.listApprovedInRange(chatId, startUtc, endUtc);
  const body = renderWeeklyDigest(
    events,
    startUtc,
    endUtc,
    group.tz,
    coerceLocale(group.language),
    group.digest_prefix,
    group.username,
  );

  const sameWeek = group.last_digest_week_start === startUtc;
  const pinnedId = group.pinned_digest_message_id;

  if (sameWeek && pinnedId !== null) {
    try {
      await api.editMessageText(chatId, pinnedId, body, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });

      return;
    } catch (err) {
      if (isMessageNotModifiedError(err)) {
        return;
      }

      logWarn('weekly.editDigest', err, { chatId, messageId: pinnedId });
    }
  }

  const sent = await api.sendMessage(chatId, body, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  });

  try {
    await api.pinChatMessage(chatId, sent.message_id, { disable_notification: true });
  } catch (err) {
    logWarn('weekly.pin', err, { chatId, messageId: sent.message_id });
  }

  if (pinnedId !== null && pinnedId !== sent.message_id) {
    try {
      await api.unpinChatMessage(chatId, pinnedId);
    } catch (err) {
      logWarn('weekly.unpin', err, { chatId, messageId: pinnedId });
    }
  }

  await repo.setPinnedDigest(chatId, sent.message_id, startUtc);
}

/**
 * Detects Telegram's benign "message is not modified" response.
 *
 * The weekly cron runs every 10 minutes, so trying to refresh an unchanged
 * digest is expected. In that case we should keep the current message instead
 * of falling back to posting a brand-new digest.
 *
 * @param err Thrown API error.
 * @returns `true` when the edit was a harmless no-op.
 */
function isMessageNotModifiedError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  return err.message.includes('message is not modified');
}
