/**
 * Runtime bindings injected by Cloudflare Workers.
 *
 * `DB` is the D1 database binding declared in `wrangler.toml`.
 * `BOT_TOKEN`, `WEBHOOK_SECRET` and `SUPERADMIN_IDS` are provided via
 * `wrangler secret put`. `SUPERADMIN_IDS` is a comma-separated list of
 * Telegram user ids permitted to run the bot-wide superadmin commands in DM.
 */
export interface Env {
  DB: D1Database;
  BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
  SUPERADMIN_IDS: string;
}
