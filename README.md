# Crowd Events Bot

Community-driven events aggregator for Telegram groups. Built on
[Cloudflare Workers](https://developers.cloudflare.com/workers/) with
[grammY](https://grammy.dev/), stores everything in
[D1](https://developers.cloudflare.com/d1/), schedules the pinned digest via
Cloudflare Cron Triggers.

## What it does

- In any group where the bot is an admin, reply to a post and mention the bot
  (e.g. `@CrowdEventsBot`). The bot will DM you a short FSM (date/time, title,
  place)
  and publish a voting card back in the group.
- Members vote with inline buttons (`👍`/`👎`). Once `votes_up` crosses the
  per-group `vote_threshold` and beats `votes_down`, the event becomes
  `approved`.
- Every 10 minutes a cron tick recomputes the next two local weeks and
  edits (or re-posts and re-pins) a pinned digest grouped by day. The digest
  window is always the current week plus the following week (Mon–Sun each). Admins can wrap the schedule with custom HTML blocks
  (welcome text, rules link, etiquette reminder, etc.) above and below the
  schedule via `/header` and `/footer`.
- Per-user submission limit: `daily_limit` events per 24h (in the group's tz).
- Admin commands in the group: `/settings`, `/threshold <N>`, `/limit <N>`,
  `/timezone <IANA>`, `/language <code>`, `/header`, `/clearheader`,
  `/footer`, `/clearfooter`.
- UI is available in English (default), German, French, Spanish and Russian.
  Admins pick the per-group language with `/language`.

## Tech stack

- TypeScript, strict mode.
- Cloudflare Workers + Cron Triggers + D1.
- grammY + `@grammyjs/conversations` (state persisted in D1).
- `dayjs` with `utc`, `timezone`, `customParseFormat` plugins for per-group
  timezone handling (default `Europe/Moscow`).
- ESLint (flat config, `typescript-eslint`, `eslint-plugin-jsdoc`) + Prettier.

## Package manager

The repository uses **pnpm**. A `pnpm-lock.yaml` is the only lockfile in the
repo and the `preinstall` script (`npx only-allow pnpm`) blocks other managers
to keep the lockfile consistent.

Common scripts:

| action       | command             |
| ------------ | ------------------- |
| install      | `pnpm install`      |
| type check   | `pnpm typecheck`    |
| lint         | `pnpm lint`         |
| lint (fix)   | `pnpm lint:fix`     |
| format       | `pnpm format`       |
| format check | `pnpm format:check` |
| full check   | `pnpm check`        |
| dev          | `pnpm dev`          |
| deploy       | `pnpm deploy`       |

## Initial setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create the D1 database and write its id into [wrangler.toml](wrangler.toml):
   ```bash
   pnpm exec wrangler d1 create crowd-events
   ```
   Replace `REPLACE_WITH_D1_ID` in `wrangler.toml` with the `database_id`
   printed by the command.
3. Apply migrations (locally for `pnpm dev`, and remotely for production):
   ```bash
   pnpm exec wrangler d1 migrations apply crowd-events --local
   pnpm exec wrangler d1 migrations apply crowd-events
   ```
4. Provision secrets:
   ```bash
   pnpm exec wrangler secret put BOT_TOKEN       # from @BotFather
   pnpm exec wrangler secret put WEBHOOK_SECRET  # any random string
   pnpm exec wrangler secret put SUPERADMIN_IDS  # comma-separated Telegram user ids
   ```
   `SUPERADMIN_IDS` controls who can run the bot-wide DM commands and who
   receives notifications when the bot is added to a non-allowlisted group.
   Find your own Telegram user id with a third-party helper such as
   `@userinfobot`.
5. Deploy:
   ```bash
   pnpm deploy
   ```
6. Register the webhook (once):
   ```bash
   curl -sS "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     --data-urlencode "url=https://<your-worker>.workers.dev/" \
     --data-urlencode "secret_token=<WEBHOOK_SECRET>"
   ```

## Bot permissions in Telegram

- Make the bot an **admin** of the target group with at least the
  `Pin Messages` right. Without it the pinned digest cannot be updated.
- Disable **privacy mode** via `@BotFather` → `Bot Settings` → `Group Privacy`
  → `Turn off`. Otherwise the bot will not see plain `@bot` mentions in group
  messages.
- Once added, any member can reply to a post and mention the bot to start the
  submission flow.

## Admin commands (per group)

Issued in the group chat by a user who is `creator` or `administrator`:

- `/settings` — prints the current `chat_id`, `language`, `tz`,
  `vote_threshold`, `daily_limit` and a preview of the digest header and
  footer.
- `/threshold <N>` — sets `vote_threshold` (`1 ≤ N ≤ 1000`). Example:
  `/threshold 15`.
- `/limit <N>` — sets `daily_limit` (`1 ≤ N ≤ 50`). Example: `/limit 5`.
- `/timezone <IANA>` (alias `/tz`) — sets the group's IANA timezone. Without
  arguments prints the current tz and usage hint. Examples: `Europe/Moscow`,
  `Europe/Berlin`, `Asia/Tbilisi`, `America/New_York`. Full list:
  [IANA tz database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
  Stored as IANA under the hood; affects both the event date parser and all
  week/day labels in the pinned digest.
- `/language <code>` (alias `/lang`) — sets the UI language for the group.
  Supported codes: `en` (English), `de` (Deutsch), `fr` (Français),
  `es` (Español), `ru` (Русский). Without arguments prints the current
  language and the list of options. The language controls every user-facing
  string the bot emits for the group: DM event-submission flow, admin
  replies, vote-card labels, pinned two-week digest (weekday and month names
  included) and error messages.
- `/header` — starts the digest header editor. The bot DMs the admin and
  expects a single message; its text, formatting (bold, italic, underline,
  strikethrough, spoiler, code, pre, blockquote) and hyperlinks are preserved
  and rendered above the two-week schedule title in the pinned digest. Max 1500
  characters.
- `/clearheader` — removes the digest header.
- `/footer` — same as `/header` but the block is rendered below the schedule
  in the pinned digest, separated by a blank line. Max 1500 characters.
- `/clearfooter` — removes the digest footer.

Defaults if the group has never had the commands invoked: `language = en`,
`tz = Europe/Moscow`, `vote_threshold = 10`, `daily_limit = 3`, no digest
header and no digest footer.

## Bot administration (superadmin)

The bot refuses to serve any group that is not explicitly present in the
`allowed_chats` allowlist. This is a hard guard on the Free-plan budget: any
unknown chat is left on the very first `my_chat_member` update, and any
subsequent message from a non-allowlisted group is dropped before it touches
the `sessions` table.

Only users whose Telegram id is listed in the `SUPERADMIN_IDS` secret can
manage the allowlist. The commands live in DM with the bot; issuing them
anywhere else (or by anyone else) is silently ignored.

### Onboarding a new group

1. A friend adds `@CrowdEventsBot` to their group as admin (with the
   `Pin Messages` right).
2. The bot immediately leaves and DMs every superadmin:
   `Left non-allowlisted chat "Group Title" (chat_id=-1001234567890) …
Reply with: /allow -1001234567890 Group Title`.
3. A superadmin copies the suggested reply (or edits the note) and sends it to
   the bot.
4. The friend re-adds the bot; it stays and `/settings` works as usual.

### Superadmin DM commands

- `/allow <chat_id> [note]` — adds a chat to the allowlist. `note` is a
  free-form label for your own bookkeeping.
- `/disallow <chat_id>` — removes the allowlist entry and asks Telegram to
  make the bot leave that chat (best-effort).
- `/allowed` — prints the current allowlist (chat id, who added it, when,
  optional note).
- `/whereami <chat_id>` — fetches the live `getChat` info for `chat_id` and
  reports whether the chat is currently on the allowlist. Useful to verify an
  id before `/allow`.

Notes:

- Leaving the chat manually (kicking the bot out) does **not** remove the row
  from `allowed_chats`. Re-adding the bot afterwards works immediately without
  another `/allow`. Use `/disallow` if you want the chat to require re-approval.
- DM with the bot remains open to any user: without a pending draft from a
  group they are a member of, they just see the default "no draft" reply, so
  DM traffic is cheap.
- Superadmin command replies are English-only by design; they are operator
  tools, not user-facing copy.

## Development

- `pnpm dev` — local Wrangler dev server. Use `--local` migrations first.
- `pnpm check` — runs TypeScript, ESLint and Prettier in sequence. Use this
  before every commit/deploy.
- `pnpm lint:fix` — auto-fix ESLint violations (JSDoc, import order, etc.).
- `pnpm format` — auto-format all files with Prettier.

### Code style policy

- **ESLint** (flat config) enforces TypeScript type-aware rules via
  `typescript-eslint` and JSDoc coverage via `eslint-plugin-jsdoc`.
- **Prettier** is the sole owner of whitespace and quoting style
  (`eslint-config-prettier` disables ESLint rules that would conflict).
- **JSDoc** is required in English on classes, functions, methods, exported
  variables, and exported types/interfaces. Types are kept in TypeScript only
  (the `jsdoc/no-types` rule forbids duplicating types in comments).

## Project layout

```
crowd-events-bot/
├── package.json            # pnpm as primary, scripts, pinned versions
├── tsconfig.json           # strict TS, Cloudflare types
├── wrangler.toml           # Worker, D1 binding, cron trigger
├── eslint.config.js        # flat ESLint config (TS + JSDoc + Prettier)
├── .prettierrc.json
├── .prettierignore
├── .editorconfig
├── .npmrc                  # engine-strict
├── migrations/
│   ├── 0001_init.sql            # D1 schema: groups, events, votes, sessions
│   ├── 0002_customization.sql   # adds groups.tz and groups.digest_prefix
│   ├── 0003_language.sql        # adds groups.language (default 'en')
│   ├── 0004_daily_digest.sql    # adds groups.last_daily_digest_day
│   ├── 0005_allowlist.sql       # adds allowed_chats table
│   ├── 0006_event_city.sql      # adds events.city
│   └── 0007_header_footer.sql   # renames groups.digest_prefix → digest_header, adds digest_footer
└── src/
    ├── index.ts            # fetch + scheduled entrypoints
    ├── bot.ts              # grammY bot composition, middleware
    ├── env.ts              # Env bindings
    ├── types.ts            # EventRow, GroupRow, EventDraft, PendingDraft, AllowedChatRow, ...
    ├── handlers/
    │   ├── mention.ts      # @bot reply → stash pending draft + DM deeplink
    │   ├── conversation.ts # FSM: event + digest header/footer conversations
    │   ├── vote.ts         # callback_query → vote, update message, approve
    │   ├── admin.ts        # /settings, /threshold, /limit, /tz, /language, /header, /footer
    │   ├── superadmin.ts   # allowlist guard + /allow /disallow /allowed /whereami
    │   ├── daily.ts        # cron: post the "events today" announcement per group
    │   └── weekly.ts       # cron: build/edit/pin the two-week digest
    ├── i18n/
    │   ├── index.ts        # t(locale), bundle registry
    │   ├── types.ts        # Locale, Messages, resolveLocale/coerceLocale
    │   └── locales/        # en, de, fr, es, ru message bundles
    ├── db/
    │   ├── repo.ts         # typed CRUD around D1
    │   └── sessionStore.ts # StorageAdapter<T> over D1 (generic)
    └── util/
        ├── date.ts         # dayjs helpers, tz-aware parser/formatters
        ├── entities.ts     # Telegram text+entities → HTML converter
        ├── link.ts         # public vs private t.me links
        ├── log.ts          # logWarn/logError helpers
        ├── render.ts       # HTML for event cards, daily and two-week digests
        └── superadmin.ts   # parseSuperadminIds / isSuperadmin helpers
```

## Known limitations / out of MVP

- No editing of events after publication (no `/cancel` either).
- No media attachments inside the voting card or digest (only link to the
  original post).
- No moderation command to force-delete an event (beyond changing threshold).
- UI is available in English (default), German, French, Spanish and Russian;
  other languages require a new locale bundle under `src/i18n/locales/`.
