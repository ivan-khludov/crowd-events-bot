import { de } from './locales/de.js';
import { en } from './locales/en.js';
import { es } from './locales/es.js';
import { fr } from './locales/fr.js';
import { ru } from './locales/ru.js';
import type { Locale, Messages } from './types.js';

export type { Locale, Messages } from './types.js';
export {
  coerceLocale,
  DEFAULT_LOCALE,
  LOCALE_NATIVE_NAMES,
  resolveLocale,
  SUPPORTED_LOCALES,
} from './types.js';

/**
 * Registry of compiled message bundles, one per supported locale.
 */
const BUNDLES: Readonly<Record<Locale, Messages>> = { en, de, fr, es, ru };

/**
 * Returns the compiled message bundle for a locale.
 *
 * @param locale Supported locale code.
 * @returns The full message bundle used by handlers and renderers.
 */
export function t(locale: Locale): Messages {
  return BUNDLES[locale];
}
