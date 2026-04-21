import type { Env } from '../env.js';

/**
 * Parses the comma-separated `SUPERADMIN_IDS` env value into a typed set.
 *
 * Non-numeric, empty or non-positive entries are silently dropped so an
 * accidental trailing comma or whitespace does not break the check.
 *
 * @param env Worker environment carrying the raw secret.
 * @returns Set of Telegram user ids with superadmin privileges.
 */
export function parseSuperadminIds(env: Env): Set<number> {
  const raw = env.SUPERADMIN_IDS ?? '';

  return new Set(
    raw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0),
  );
}

/**
 * Tests whether a Telegram user id is listed as a bot-wide superadmin.
 *
 * @param userId Telegram user id (or `undefined` when the update has no sender).
 * @param env Worker environment carrying `SUPERADMIN_IDS`.
 * @returns `true` if the user is authorized to run superadmin DM commands.
 */
export function isSuperadmin(userId: number | undefined, env: Env): boolean {
  if (!userId) {
    return false;
  }

  return parseSuperadminIds(env).has(userId);
}
