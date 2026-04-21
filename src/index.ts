import { webhookCallback } from 'grammy';

import { createBot } from './bot.js';
import type { Env } from './env.js';
import { runDailyDigest } from './handlers/daily.js';
import { runWeeklyDigest } from './handlers/weekly.js';

/**
 * Cloudflare Workers entry point: routes Telegram webhooks to grammY and runs
 * the weekly-digest cron job.
 */
export default {
  /**
   * Handles Telegram webhook HTTP requests.
   *
   * @param request Incoming `fetch` request.
   * @param env Worker bindings and secrets.
   * @returns HTTP response for Telegram.
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const bot = createBot(env);
    const handler = webhookCallback(bot, 'cloudflare-mod', {
      secretToken: env.WEBHOOK_SECRET,
    });

    return handler(request);
  },

  /**
   * Handles scheduled cron invocations.
   *
   * Runs both the weekly pinned digest refresh and the once-per-local-day
   * "events today" announcement. Each job is internally idempotent and
   * guarded by per-group state, so running them on every tick is safe.
   *
   * @param _controller Cron metadata (unused).
   * @param env Worker bindings and secrets.
   * @param ctx Execution context for background waits.
   */
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(Promise.all([runWeeklyDigest(env), runDailyDigest(env)]));
  },
} satisfies ExportedHandler<Env>;
