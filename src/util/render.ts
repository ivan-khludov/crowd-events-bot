import { t } from '../i18n/index.js';
import type { Locale } from '../i18n/types.js';
import type { EventRow } from '../types.js';
import {
  formatLocalDateTime,
  formatLocalDayLabel,
  formatLocalTime,
  formatWeekHeader,
  localDayKey,
} from './date.js';
import { buildPostLink } from './link.js';

/**
 * Escapes a value for Telegram `parse_mode: "HTML"`.
 *
 * @param input Raw user-supplied string.
 * @returns HTML-safe text.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the event voting card body (HTML).
 *
 * The inline keyboard with up/down votes is rendered separately by the handlers,
 * but the numeric counters in the button labels are kept in sync with this body.
 *
 * @param event Event row to render.
 * @param tz IANA timezone of the group the event belongs to.
 * @param locale UI locale.
 * @param groupUsername Optional group username for the "original post" link.
 * @returns HTML message body.
 */
export function renderEventCard(
  event: EventRow,
  tz: string,
  locale: Locale,
  groupUsername?: string | null,
): string {
  const messages = t(locale);
  const title = escapeHtml(event.title);
  const place = escapeHtml(event.place);
  const city = event.city ? escapeHtml(event.city) : '';
  const when = formatLocalDateTime(event.datetime_utc, tz, locale);
  const link = buildPostLink(event.group_chat_id, event.original_message_id, groupUsername);
  const location = city ? `${city} / ${place}` : place;

  return (
    `<b>${title}</b>\n` +
    `📅 ${when} / ${location}\n` +
    `🔗 <a href="${link}">${messages.card.originalLinkText}</a>\n` +
    `👍 ${event.votes_up} | 👎 ${event.votes_down}`
  );
}

/**
 * Renders labels for the inline vote buttons.
 *
 * @param up Number of up-votes.
 * @param down Number of down-votes.
 * @returns `{ upLabel, downLabel }` ready for `InlineKeyboard`.
 */
export function renderVoteButtonLabels(
  up: number,
  down: number,
): { upLabel: string; downLabel: string } {
  return { upLabel: `👍 ${up}`, downLabel: `👎 ${down}` };
}

/**
 * Renders the full weekly digest body (HTML) from approved events.
 *
 * Events are grouped by local calendar day and sorted by time within each day.
 * When `events` is empty, a placeholder is produced so the pinned post still
 * makes sense visually. An optional `prefixHtml` is prepended verbatim so
 * group admins can add a static welcome/rules block above the schedule.
 *
 * @param events Approved events within the week window.
 * @param startUtc Week start in ISO UTC (Monday 00:00 local).
 * @param endUtc Exclusive week end in ISO UTC.
 * @param tz IANA timezone used for grouping and formatting.
 * @param locale UI locale.
 * @param prefixHtml Optional pre-rendered HTML prefix, or `null`/`undefined`.
 * @param groupUsername Optional group username for per-event links.
 * @returns HTML message body.
 */
export function renderWeeklyDigest(
  events: EventRow[],
  startUtc: string,
  endUtc: string,
  tz: string,
  locale: Locale,
  prefixHtml?: string | null,
  groupUsername?: string | null,
): string {
  const messages = t(locale);
  const header = formatWeekHeader(startUtc, endUtc, tz, locale);
  const bodyParts: string[] = [];

  if (events.length === 0) {
    bodyParts.push(`<b>${header}</b>`);
    bodyParts.push('');
    bodyParts.push(messages.digest.empty);
  } else {
    bodyParts.push(`<b>${header}</b>`);
    const byDay = new Map<number, EventRow[]>();

    for (const e of events) {
      const key = localDayKey(e.datetime_utc, tz);
      const list = byDay.get(key);

      if (list) {
        list.push(e);
      } else {
        byDay.set(key, [e]);
      }
    }

    const orderedKeys = [...byDay.keys()].sort((a, b) => a - b);

    for (const key of orderedKeys) {
      const dayEvents = byDay.get(key);

      if (!dayEvents || dayEvents.length === 0) {
        continue;
      }

      const first = dayEvents[0];

      if (!first) {
        continue;
      }

      const dayLabel = formatLocalDayLabel(first.datetime_utc, tz, locale);
      bodyParts.push('');
      bodyParts.push(`<b><u>${dayLabel}</u></b>`);

      for (const e of dayEvents) {
        const title = escapeHtml(e.title);
        const place = escapeHtml(e.place);
        const city = e.city ? escapeHtml(e.city) : '';
        const time = formatLocalTime(e.datetime_utc, tz);
        const link = buildPostLink(e.group_chat_id, e.original_message_id, groupUsername);
        const location = city ? `${city} / ${place}` : place;
        bodyParts.push(`• <a href="${link}">${title}</a> / ${location}, ${time}`);
      }
    }
  }

  const body = bodyParts.join('\n');
  const prefix = prefixHtml?.trim();

  if (prefix && prefix.length > 0) {
    return `${prefix}\n\n${body}`;
  }

  return body;
}

/**
 * Renders the daily "events today" announcement body (HTML).
 *
 * The layout is a compact header followed by a bullet list of the approved
 * events scheduled for the current local day, sorted by time. When `events`
 * is empty, a localized placeholder is produced instead of the bullet list.
 *
 * @param events Approved events scheduled within the current local day.
 * @param tz IANA timezone used for formatting event times.
 * @param locale UI locale for the header and placeholder.
 * @param groupUsername Optional group username for per-event links.
 * @returns HTML message body.
 */
export function renderDailyDigest(
  events: EventRow[],
  tz: string,
  locale: Locale,
  groupUsername?: string | null,
): string {
  const messages = t(locale);
  const lines: string[] = [`<b>${messages.digest.todayHeader}</b>`];

  if (events.length === 0) {
    lines.push(messages.digest.todayEmpty);
  } else {
    for (const e of events) {
      const title = escapeHtml(e.title);
      const place = escapeHtml(e.place);
      const city = e.city ? escapeHtml(e.city) : '';
      const time = formatLocalTime(e.datetime_utc, tz);
      const link = buildPostLink(e.group_chat_id, e.original_message_id, groupUsername);
      const location = city ? `${city} / ${place}` : place;
      lines.push(`• <a href="${link}">${title}</a> / ${location}, ${time}`);
    }
  }

  return lines.join('\n');
}
