/**
 * Structured context passed alongside a log message.
 *
 * Keeps the logger call-site terse while still carrying key/value pairs that
 * are useful for diagnostics (e.g. `chatId`, `eventId`).
 */
export type LogExtra = Record<string, unknown>;

/**
 * Logs a non-fatal warning. Intended for expected failure paths (for example,
 * `message is not modified`, missing pin rights, rate-limited edits).
 *
 * The current implementation writes to `console.warn`, which is forwarded to
 * `wrangler tail` on Cloudflare Workers.
 *
 * @param scope Short call-site tag such as `weekly.pin` or `vote.editCard`.
 * @param err Thrown value caught in the handler.
 * @param extra Optional key/value diagnostics.
 */
export function logWarn(scope: string, err: unknown, extra?: LogExtra): void {
  if (extra) {
    console.warn(`[${scope}]`, formatError(err), extra);

    return;
  }

  console.warn(`[${scope}]`, formatError(err));
}

/**
 * Logs a fatal-for-this-operation error. Intended for unexpected failures
 * that should be surfaced and investigated, even though we swallow them to
 * keep surrounding logic going.
 *
 * @param scope Short call-site tag such as `weekly.group` or `admin.perm`.
 * @param err Thrown value caught in the handler.
 * @param extra Optional key/value diagnostics.
 */
export function logError(scope: string, err: unknown, extra?: LogExtra): void {
  if (extra) {
    console.error(`[${scope}]`, formatError(err), extra);

    return;
  }

  console.error(`[${scope}]`, formatError(err));
}

/**
 * Coerces an unknown thrown value to something printable without losing the
 * stack trace for `Error` instances.
 *
 * @param err Thrown value.
 * @returns Value that `console.*` will render meaningfully.
 */
function formatError(err: unknown): unknown {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }

  return err;
}
