/**
 * Supported UI locales. English is the default for new groups.
 */
export type Locale = 'en' | 'de' | 'fr' | 'es' | 'ru';

/**
 * List of supported locale codes.
 */
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'de', 'fr', 'es', 'ru'] as const;

/**
 * Fallback locale used when a group has no language set yet or when the stored
 * value cannot be resolved. Matches the SQL column default.
 */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Native-language label for each locale, suitable for human-readable listings
 * (e.g. `/settings` and the `/language` help message).
 */
export const LOCALE_NATIVE_NAMES: Readonly<Record<Locale, string>> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
};

/**
 * Validates a user-supplied locale code and narrows it to {@link Locale}.
 *
 * @param input Raw locale code (case-insensitive).
 * @returns The matching locale or `null` when it is not supported.
 */
export function resolveLocale(input: string | null | undefined): Locale | null {
  if (!input) {
    return null;
  }

  const lc = input.trim().toLowerCase();

  return (SUPPORTED_LOCALES as readonly string[]).includes(lc) ? (lc as Locale) : null;
}

/**
 * Coerces an arbitrary stored language string into a valid {@link Locale},
 * falling back to {@link DEFAULT_LOCALE} when the value is missing or unknown.
 *
 * @param input Stored language value (may be `null`/`undefined` for legacy rows).
 * @returns A supported locale, never `null`.
 */
export function coerceLocale(input: string | null | undefined): Locale {
  return resolveLocale(input) ?? DEFAULT_LOCALE;
}

/**
 * Arguments rendered into the day label of the weekly digest.
 */
export interface DayLabelArgs {
  weekday: string;
  day: number;
  month: string;
}

/**
 * Arguments rendered into the per-event date-time label shown on voting cards.
 * Kept locale-aware because different languages order day/month differently.
 */
export interface DateTimeArgs {
  day: number;
  month: string;
  time: string;
}

/**
 * Arguments rendered into the week header of the weekly digest.
 */
export interface WeekHeaderArgs {
  startDay: number;
  endDay: number;
  startMonth: string;
  endMonth: string;
  sameMonth: boolean;
}

/**
 * Arguments rendered into the `/settings` summary reply.
 */
export interface SettingsArgs {
  chatId: number;
  tz: string;
  threshold: number;
  limit: number;
  prefixPreview: string;
  languageLabel: string;
}

/**
 * Full message bundle for a single locale. Every user-facing string in the
 * bot lives here; handlers call `t(locale).…` and never hardcode copy.
 */
export interface Messages {
  event: {
    noDraft: string;
    askDate: (format: string, tz: string) => string;
    invalidDate: (format: string) => string;
    askTitle: string;
    titleEmpty: string;
    askCity: string;
    cityEmpty: string;
    askPlace: string;
    placeEmpty: string;
    published: string;
  };
  prefix: {
    noDraft: string;
    ask: (maxLen: number) => string;
    cancelled: string;
    tooLong: (length: number, max: number) => string;
    empty: string;
    saveFailed: string;
    saved: string;
    previewHeader: string;
    howToChange: string;
  };
  start: {
    welcome: string;
  };
  mention: {
    limitReached: (limit: number) => string;
    invite: (firstName: string) => string;
    openDmButton: string;
  };
  vote: {
    unknownUser: string;
    eventNotFound: string;
    approved: string;
    recorded: string;
  };
  card: {
    originalLinkText: string;
    dateTime: (args: DateTimeArgs) => string;
  };
  digest: {
    empty: string;
    weekHeader: (args: WeekHeaderArgs) => string;
    dayLabel: (args: DayLabelArgs) => string;
    weekdays: readonly string[];
    months: readonly string[];
    todayHeader: string;
    todayEmpty: string;
  };
  admin: {
    onlyGroup: string;
    onlyAdmin: string;
    checkFailed: string;
    settings: (args: SettingsArgs) => string;
    prefixPreviewNone: string;
    prefixPreviewSet: (length: number, snippet: string) => string;
    thresholdUsage: (min: number, max: number) => string;
    thresholdOk: (value: number) => string;
    limitUsage: (min: number, max: number) => string;
    limitOk: (value: number) => string;
    tzCurrent: (tz: string) => string;
    tzInvalid: (input: string) => string;
    tzOk: (tz: string, time: string, day: string) => string;
    prefixAskDm: string;
    clearPrefixOk: string;
    languageUsage: (current: string, options: string) => string;
    languageInvalid: (input: string, options: string) => string;
    languageOk: (name: string) => string;
  };
}
