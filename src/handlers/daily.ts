import { Api } from 'grammy';

import { Repo } from '../db/repo.js';
import type { Env } from '../env.js';
import { coerceLocale } from '../i18n/types.js';
import type { GroupRow } from '../types.js';
import { dayBounds, localDayIso } from '../util/date.js';
import { logError } from '../util/log.js';
import { renderDailyDigest } from '../util/render.js';

/**
 * Publishes the "events today" announcement in every known group once per
 * local calendar day.
 *
 * The function is designed to run on the same 10-minute cron as the weekly
 * digest. For each group it:
 *
 * 1. Computes the current local day key (`YYYY-MM-DD` in the group's tz).
 * 2. Skips the group if `groups.last_daily_digest_day` already matches, so
 *    repeated ticks within the same local day are no-ops.
 * 3. Selects all approved events scheduled in the current local-day window.
 * 4. Renders a localized announcement (with a "no events today" placeholder
 *    when the list is empty) and sends it to the group chat.
 * 5. Persists the new `last_daily_digest_day` value so the next tick of the
 *    same day skips this group.
 *
 * The update is written only after a successful send, so Worker retries
 * after a transient Telegram error will attempt to post again on the next
 * tick instead of losing the announcement.
 *
 * @param env Worker environment with D1 and bot credentials.
 */
export async function runDailyDigest(env: Env): Promise<void> {
  const api = new Api(env.BOT_TOKEN);
  const repo = new Repo(env.DB);
  const groups = await repo.listGroups();

  for (const group of groups) {
    try {
      await announceGroupDaily(api, repo, group);
    } catch (err) {
      logError('daily.group', err, { chatId: group.chat_id });
    }
  }
}

/**
 * Posts the daily announcement for a single group when the local day has
 * advanced past the last announced day.
 *
 * @param api grammY Bot API client.
 * @param repo Database access layer.
 * @param group Group row pre-loaded by the outer loop.
 */
async function announceGroupDaily(api: Api, repo: Repo, group: GroupRow): Promise<void> {
  const chatId = group.chat_id;
  const todayKey = localDayIso(group.tz);

  if (group.last_daily_digest_day === todayKey) {
    return;
  }

  const { startUtc, endUtc } = dayBounds(group.tz);
  const events = await repo.listApprovedInRange(chatId, startUtc, endUtc);
  const body = renderDailyDigest(events, group.tz, coerceLocale(group.language), group.username);

  await api.sendMessage(chatId, body, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
  });

  await repo.setLastDailyDigestDay(chatId, todayKey);
}
