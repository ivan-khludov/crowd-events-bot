import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

import { t } from '../i18n/index.js';
import type { Locale } from '../i18n/types.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/**
 * Default IANA timezone used when a group has not been configured yet. Kept
 * for historical reasons: before the per-group `tz` column existed, the bot
 * hardcoded Moscow time.
 */
export const DEFAULT_TZ = 'Europe/Moscow';

/**
 * Strict human input format expected from the date FSM step.
 */
export const INPUT_FORMAT = 'DD.MM.YYYY HH:mm';

/**
 * Checks that a string is a valid IANA timezone identifier recognised by the
 * runtime's ICU database. Uses `Intl.DateTimeFormat`, which is available in
 * Cloudflare Workers and Node.
 *
 * @param tz Candidate identifier (e.g. `Europe/Berlin`).
 * @returns `true` when the identifier is accepted, `false` otherwise.
 */
export function isValidIanaTz(tz: string): boolean {
  if (typeof tz !== 'string' || tz.length === 0) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });

    return true;
  } catch {
    return false;
  }
}

/**
 * Parses a local-timezone datetime string in strict `DD.MM.YYYY HH:mm` format.
 *
 * @param input Raw user input from the FSM date step.
 * @param tz IANA timezone the input is interpreted in.
 * @returns ISO UTC string or `null` when the input is invalid.
 */
export function parseLocalDate(input: string, tz: string): string | null {
  const trimmed = input.trim();
  const d = dayjs.tz(trimmed, INPUT_FORMAT, tz);

  if (!d.isValid()) {
    return null;
  }

  if (d.format(INPUT_FORMAT) !== trimmed) {
    return null;
  }

  return d.utc().toISOString();
}

/**
 * Computes the half-open `[start, end)` week bounds in UTC for the local
 * week that contains `refUtcIso`. The week starts on Monday 00:00 in `tz`.
 *
 * @param tz IANA timezone that defines the local week.
 * @param refUtcIso Reference instant in ISO UTC (defaults to "now").
 * @returns Start and end ISO UTC timestamps.
 */
export function weekBounds(tz: string, refUtcIso?: string): { startUtc: string; endUtc: string } {
  const ref = refUtcIso ? dayjs.utc(refUtcIso) : dayjs.utc();
  const local = ref.tz(tz);
  const dow = local.day(); // 0 = Sun .. 6 = Sat
  const daysFromMonday = (dow + 6) % 7;
  const start = local.subtract(daysFromMonday, 'day').startOf('day');
  const end = start.add(7, 'day');

  return { startUtc: start.utc().toISOString(), endUtc: end.utc().toISOString() };
}

/**
 * Returns the start of the current local day in `tz` as an ISO UTC string.
 * Used for the per-user daily submission limit.
 *
 * @param tz IANA timezone.
 * @returns ISO UTC string of 00:00 in `tz` today.
 */
export function startOfDayUtcIso(tz: string): string {
  return dayjs.utc().tz(tz).startOf('day').utc().toISOString();
}

/**
 * Computes the half-open `[start, end)` day bounds in UTC for the local day
 * that contains `refUtcIso`. The day starts at 00:00 in `tz`.
 *
 * @param tz IANA timezone that defines the local day.
 * @param refUtcIso Reference instant in ISO UTC (defaults to "now").
 * @returns Start and end ISO UTC timestamps.
 */
export function dayBounds(tz: string, refUtcIso?: string): { startUtc: string; endUtc: string } {
  const ref = refUtcIso ? dayjs.utc(refUtcIso) : dayjs.utc();
  const start = ref.tz(tz).startOf('day');
  const end = start.add(1, 'day');

  return { startUtc: start.utc().toISOString(), endUtc: end.utc().toISOString() };
}

/**
 * Returns a stable `YYYY-MM-DD` key for the local calendar day in `tz`.
 * Used as an idempotency key for the daily announcement cron loop.
 *
 * @param tz IANA timezone.
 * @param refUtcIso Reference instant in ISO UTC (defaults to "now").
 * @returns Local day key in `YYYY-MM-DD` format.
 */
export function localDayIso(tz: string, refUtcIso?: string): string {
  const ref = refUtcIso ? dayjs.utc(refUtcIso) : dayjs.utc();

  return ref.tz(tz).format('YYYY-MM-DD');
}

/**
 * Formats a UTC timestamp as `HH:mm` in `tz` (used in event cards).
 *
 * @param isoUtc ISO UTC instant.
 * @param tz IANA timezone.
 * @returns Zero-padded hours:minutes string.
 */
export function formatLocalTime(isoUtc: string, tz: string): string {
  return dayjs.utc(isoUtc).tz(tz).format('HH:mm');
}

/**
 * Renders a localized `day + month + time` label (e.g. "24 апреля, 18:00",
 * "April 24, 18:00") using the locale's month names and date-time template.
 *
 * @param isoUtc ISO UTC instant.
 * @param tz IANA timezone.
 * @param locale UI locale.
 * @returns Localised date-time label.
 */
export function formatLocalDateTime(isoUtc: string, tz: string, locale: Locale): string {
  const messages = t(locale);
  const d = dayjs.utc(isoUtc).tz(tz);
  const month = messages.digest.months[d.month()] ?? '';
  const time = d.format('HH:mm');

  return messages.card.dateTime({ day: d.date(), month, time });
}

/**
 * Returns an integer `YYYYMMDD` key for the calendar day of `isoUtc` in `tz`.
 * Useful as a stable group key in the weekly digest.
 *
 * @param isoUtc ISO UTC instant.
 * @param tz IANA timezone.
 * @returns Numeric `YYYYMMDD` for the local day.
 */
export function localDayKey(isoUtc: string, tz: string): number {
  return Number(dayjs.utc(isoUtc).tz(tz).format('YYYYMMDD'));
}

/**
 * Renders a local day label using the locale's weekday and month names
 * (e.g. "Monday, April 20" in English, "Понедельник, 20 апреля" in Russian).
 *
 * @param isoUtc ISO UTC instant that maps to the local day.
 * @param tz IANA timezone.
 * @param locale UI locale.
 * @returns Localised label.
 */
export function formatLocalDayLabel(isoUtc: string, tz: string, locale: Locale): string {
  const messages = t(locale);
  const d = dayjs.utc(isoUtc).tz(tz);
  const wd = (d.day() + 6) % 7;
  const weekday = messages.digest.weekdays[wd] ?? '';
  const month = messages.digest.months[d.month()] ?? '';

  return messages.digest.dayLabel({ weekday, day: d.date(), month });
}

/**
 * Renders the weekly digest header. The locale decides the exact template
 * (same-month vs cross-month). Inputs are numeric days + localized month
 * names so each language can pick its own grammar.
 *
 * @param startUtc ISO UTC of the week start (Monday 00:00 local).
 * @param endUtc ISO UTC of the exclusive week end (next Monday 00:00 local).
 * @param tz IANA timezone.
 * @param locale UI locale.
 * @returns Localised header string.
 */
export function formatWeekHeader(
  startUtc: string,
  endUtc: string,
  tz: string,
  locale: Locale,
): string {
  const messages = t(locale);
  const start = dayjs.utc(startUtc).tz(tz);
  const last = dayjs.utc(endUtc).tz(tz).subtract(1, 'day');
  const startMonth = messages.digest.months[start.month()] ?? '';
  const endMonth = messages.digest.months[last.month()] ?? '';

  return messages.digest.weekHeader({
    startDay: start.date(),
    endDay: last.date(),
    startMonth,
    endMonth,
    sameMonth: start.month() === last.month(),
  });
}
