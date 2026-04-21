import type {
  AllowedChatRow,
  EventRow,
  EventStatus,
  GroupRow,
  PendingDraft,
  VoteType,
} from '../types.js';

/**
 * Thin data-access layer around the D1 binding. All methods return plain
 * row objects typed by `../types.ts`.
 */
export class Repo {
  /**
   * Creates a new repository bound to a specific D1 database.
   *
   * @param db D1 database binding from the worker environment.
   */
  constructor(private readonly db: D1Database) {}

  /**
   * Returns the group row for `chatId` or `null` if it was never seen.
   *
   * @param chatId Telegram chat id of the group.
   * @returns Stored configuration row or `null`.
   */
  async getGroup(chatId: number): Promise<GroupRow | null> {
    const row = await this.db
      .prepare(
        `SELECT chat_id, username, title, vote_threshold, daily_limit,
                pinned_digest_message_id, last_digest_week_start,
                tz, digest_prefix, language, last_daily_digest_day
           FROM groups WHERE chat_id = ?`,
      )
      .bind(chatId)
      .first<GroupRow>();

    return row ?? null;
  }

  /**
   * Inserts the group row on first contact or refreshes its mutable metadata.
   * Thresholds are preserved across calls.
   *
   * @param chatId Telegram chat id of the group.
   * @param username Public username of the group, if any.
   * @param title Current chat title.
   * @returns The up-to-date group row.
   */
  async upsertGroupMeta(
    chatId: number,
    username: string | null,
    title: string | null,
  ): Promise<GroupRow> {
    await this.db
      .prepare(
        `INSERT INTO groups (chat_id, username, title)
             VALUES (?1, ?2, ?3)
         ON CONFLICT(chat_id) DO UPDATE SET
             username   = excluded.username,
             title      = excluded.title,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(chatId, username, title)
      .run();
    const row = await this.getGroup(chatId);

    if (!row) {
      throw new Error(`Group ${chatId} missing after upsert`);
    }

    return row;
  }

  /**
   * Updates the `vote_threshold` of a group, creating the row if absent.
   *
   * @param chatId Telegram chat id of the group.
   * @param threshold New minimum number of up-votes required for approval.
   */
  async setVoteThreshold(chatId: number, threshold: number): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO groups (chat_id, vote_threshold)
             VALUES (?1, ?2)
         ON CONFLICT(chat_id) DO UPDATE SET
             vote_threshold = excluded.vote_threshold,
             updated_at     = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(chatId, threshold)
      .run();
  }

  /**
   * Updates the per-user daily submission `daily_limit`, creating the row if absent.
   *
   * @param chatId Telegram chat id of the group.
   * @param limit New maximum number of events per user per day.
   */
  async setDailyLimit(chatId: number, limit: number): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO groups (chat_id, daily_limit)
             VALUES (?1, ?2)
         ON CONFLICT(chat_id) DO UPDATE SET
             daily_limit = excluded.daily_limit,
             updated_at  = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(chatId, limit)
      .run();
  }

  /**
   * Persists digest pin bookkeeping for a group.
   *
   * @param chatId Telegram chat id of the group.
   * @param messageId Message id of the currently pinned digest, or `null`.
   * @param weekStart ISO UTC timestamp for the start of the digest week.
   */
  async setPinnedDigest(
    chatId: number,
    messageId: number | null,
    weekStart: string | null,
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE groups
            SET pinned_digest_message_id = ?1,
                last_digest_week_start   = ?2,
                updated_at               = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE chat_id = ?3`,
      )
      .bind(messageId, weekStart, chatId)
      .run();
  }

  /**
   * Persists the last local day (YYYY-MM-DD in the group's tz) for which the
   * cron loop posted the "events today" announcement. Used as an idempotency
   * guard so retries and repeated 10-minute ticks post at most one daily
   * message per local day per group.
   *
   * @param chatId Telegram chat id of the group.
   * @param day Local day key in `YYYY-MM-DD` format.
   */
  async setLastDailyDigestDay(chatId: number, day: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE groups
            SET last_daily_digest_day = ?1,
                updated_at            = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE chat_id = ?2`,
      )
      .bind(day, chatId)
      .run();
  }

  /**
   * Returns every known group. Used by the cron digest loop.
   *
   * @returns All rows from the `groups` table.
   */
  async listGroups(): Promise<GroupRow[]> {
    const res = await this.db
      .prepare(
        `SELECT chat_id, username, title, vote_threshold, daily_limit,
                pinned_digest_message_id, last_digest_week_start,
                tz, digest_prefix, language, last_daily_digest_day
           FROM groups`,
      )
      .all<GroupRow>();

    return res.results ?? [];
  }

  /**
   * Updates the IANA timezone of a group, creating the row if absent.
   *
   * @param chatId Telegram chat id of the group.
   * @param tz Validated IANA timezone identifier (e.g. `Europe/Moscow`).
   */
  async setGroupTz(chatId: number, tz: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO groups (chat_id, tz)
             VALUES (?1, ?2)
         ON CONFLICT(chat_id) DO UPDATE SET
             tz         = excluded.tz,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(chatId, tz)
      .run();
  }

  /**
   * Updates the UI language of a group, creating the row if absent.
   *
   * @param chatId Telegram chat id of the group.
   * @param language Validated locale code (`en`, `de`, `fr`, `es`, `ru`).
   */
  async setGroupLanguage(chatId: number, language: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO groups (chat_id, language)
             VALUES (?1, ?2)
         ON CONFLICT(chat_id) DO UPDATE SET
             language   = excluded.language,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(chatId, language)
      .run();
  }

  /**
   * Updates the HTML prefix that is prepended to the weekly pinned digest.
   *
   * @param chatId Telegram chat id of the group.
   * @param html Pre-rendered HTML snippet, or `null` to remove the prefix.
   */
  async setDigestPrefix(chatId: number, html: string | null): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO groups (chat_id, digest_prefix)
             VALUES (?1, ?2)
         ON CONFLICT(chat_id) DO UPDATE SET
             digest_prefix = excluded.digest_prefix,
             updated_at    = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(chatId, html)
      .run();
  }

  /**
   * Counts how many events a user has submitted since `sinceIsoUtc`.
   *
   * @param creatorId Telegram user id.
   * @param sinceIsoUtc Lower bound (inclusive) in ISO UTC.
   * @returns Number of event rows matching the filter.
   */
  async countEventsByUserSince(creatorId: number, sinceIsoUtc: string): Promise<number> {
    const row = await this.db
      .prepare(`SELECT COUNT(*) AS n FROM events WHERE creator_id = ?1 AND created_at >= ?2`)
      .bind(creatorId, sinceIsoUtc)
      .first<{ n: number }>();

    return row?.n ?? 0;
  }

  /**
   * Inserts a fully collected event draft into the `events` table.
   *
   * @param row New event row; `votes_up`/`votes_down` default to 0.
   */
  async insertEvent(
    row: Omit<EventRow, 'votes_up' | 'votes_down' | 'created_at' | 'status'> & {
      status?: EventStatus;
    },
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO events
            (id, group_chat_id, creator_id, original_message_id,
             title, place, datetime_utc, status, vote_message_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
      .bind(
        row.id,
        row.group_chat_id,
        row.creator_id,
        row.original_message_id,
        row.title,
        row.place,
        row.datetime_utc,
        row.status ?? 'pending',
        row.vote_message_id,
      )
      .run();
  }

  /**
   * Stores the `vote_message_id` once the voting card has been posted.
   *
   * @param eventId Event identifier.
   * @param messageId Telegram message id of the posted card.
   */
  async setVoteMessageId(eventId: string, messageId: number): Promise<void> {
    await this.db
      .prepare(`UPDATE events SET vote_message_id = ?1 WHERE id = ?2`)
      .bind(messageId, eventId)
      .run();
  }

  /**
   * Loads a single event by id.
   *
   * @param eventId Event identifier.
   * @returns The event row or `null`.
   */
  async getEvent(eventId: string): Promise<EventRow | null> {
    const row = await this.db
      .prepare(
        `SELECT id, group_chat_id, creator_id, original_message_id,
                title, place, datetime_utc, status, vote_message_id,
                votes_up, votes_down, created_at
           FROM events WHERE id = ?1`,
      )
      .bind(eventId)
      .first<EventRow>();

    return row ?? null;
  }

  /**
   * Inserts or replaces a vote and returns the updated tallies.
   * Atomic via D1 batch so the `events.votes_*` counters stay consistent.
   *
   * @param eventId Event identifier.
   * @param userId Telegram user id.
   * @param type Direction of the vote.
   * @returns Fresh `{ up, down }` counters plus current status and group id.
   */
  async castVote(
    eventId: string,
    userId: number,
    type: VoteType,
  ): Promise<{ up: number; down: number; status: EventStatus; groupChatId: number } | null> {
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO votes (event_id, user_id, type)
               VALUES (?1, ?2, ?3)
           ON CONFLICT(event_id, user_id) DO UPDATE SET type = excluded.type`,
        )
        .bind(eventId, userId, type),
      this.db
        .prepare(
          `UPDATE events SET
              votes_up   = (SELECT COUNT(*) FROM votes WHERE event_id = ?1 AND type = 'up'),
              votes_down = (SELECT COUNT(*) FROM votes WHERE event_id = ?1 AND type = 'down')
            WHERE id = ?1`,
        )
        .bind(eventId),
    ]);
    const row = await this.db
      .prepare(
        `SELECT votes_up AS up, votes_down AS down, status, group_chat_id AS groupChatId
           FROM events WHERE id = ?1`,
      )
      .bind(eventId)
      .first<{ up: number; down: number; status: EventStatus; groupChatId: number }>();

    return row ?? null;
  }

  /**
   * Transitions an event from `pending` to `approved` idempotently.
   *
   * @param eventId Event identifier.
   * @returns `true` if this call performed the transition.
   */
  async approveEvent(eventId: string): Promise<boolean> {
    const res = await this.db
      .prepare(`UPDATE events SET status = 'approved' WHERE id = ?1 AND status = 'pending'`)
      .bind(eventId)
      .run();

    return (res.meta.changes ?? 0) > 0;
  }

  /**
   * Stores a pending draft for a user so that the DM entry point can route
   * them into the matching conversation when they write to the bot. Keyed by
   * user id in the generic `sessions` table with a `pending:` prefix.
   *
   * @param userId Telegram user id of the draft owner.
   * @param draft Discriminated payload describing which flow to resume.
   */
  async putPendingDraft(userId: number, draft: PendingDraft): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO sessions (key, value)
             VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET
             value      = excluded.value,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(this.pendingKey(userId), JSON.stringify(draft))
      .run();
  }

  /**
   * Atomically reads and removes a pending draft for a user.
   *
   * @param userId Telegram user id.
   * @returns The draft payload or `null` if nothing was pending.
   */
  async takePendingDraft(userId: number): Promise<PendingDraft | null> {
    const key = this.pendingKey(userId);
    const row = await this.db
      .prepare(`SELECT value FROM sessions WHERE key = ?1`)
      .bind(key)
      .first<{ value: string }>();

    if (!row) {
      return null;
    }

    await this.db.prepare(`DELETE FROM sessions WHERE key = ?1`).bind(key).run();

    return JSON.parse(row.value) as PendingDraft;
  }

  /**
   * Builds the session storage key for a user's pending draft.
   *
   * @param userId Telegram user id.
   * @returns Prefixed session key.
   */
  private pendingKey(userId: number): string {
    return `pending:${userId}`;
  }

  /**
   * Selects approved events of a group scheduled within the given UTC window.
   *
   * @param groupChatId Telegram chat id of the group.
   * @param fromIsoUtc Lower bound (inclusive).
   * @param toIsoUtc Upper bound (exclusive).
   * @returns Ordered list of events with `datetime_utc` ascending.
   */
  async listApprovedInRange(
    groupChatId: number,
    fromIsoUtc: string,
    toIsoUtc: string,
  ): Promise<EventRow[]> {
    const res = await this.db
      .prepare(
        `SELECT id, group_chat_id, creator_id, original_message_id,
                title, place, datetime_utc, status, vote_message_id,
                votes_up, votes_down, created_at
           FROM events
          WHERE group_chat_id = ?1
            AND status        = 'approved'
            AND datetime_utc >= ?2
            AND datetime_utc  < ?3
          ORDER BY datetime_utc ASC`,
      )
      .bind(groupChatId, fromIsoUtc, toIsoUtc)
      .all<EventRow>();

    return res.results ?? [];
  }

  /**
   * Tests whether `chatId` is on the bot-wide allowlist.
   *
   * @param chatId Telegram chat id to check.
   * @returns `true` if the chat is allowed to be served.
   */
  async isAllowedChat(chatId: number): Promise<boolean> {
    const row = await this.db
      .prepare(`SELECT 1 AS present FROM allowed_chats WHERE chat_id = ?1`)
      .bind(chatId)
      .first<{ present: number }>();

    return row !== null;
  }

  /**
   * Inserts or updates an allowlist entry. Replacing an existing row refreshes
   * `added_by` and `note` and leaves `created_at` at its original timestamp.
   *
   * @param chatId Telegram chat id to allow.
   * @param addedBy Telegram user id of the superadmin who approved it.
   * @param note Free-form annotation (e.g. group name); `null` to clear.
   */
  async addAllowedChat(chatId: number, addedBy: number, note: string | null): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO allowed_chats (chat_id, added_by, note)
             VALUES (?1, ?2, ?3)
         ON CONFLICT(chat_id) DO UPDATE SET
             added_by = excluded.added_by,
             note     = excluded.note`,
      )
      .bind(chatId, addedBy, note)
      .run();
  }

  /**
   * Removes an allowlist entry.
   *
   * @param chatId Telegram chat id to revoke.
   * @returns `true` if a row was actually removed.
   */
  async removeAllowedChat(chatId: number): Promise<boolean> {
    const res = await this.db
      .prepare(`DELETE FROM allowed_chats WHERE chat_id = ?1`)
      .bind(chatId)
      .run();

    return (res.meta.changes ?? 0) > 0;
  }

  /**
   * Returns every allowlist entry, most recently added first.
   *
   * @returns Rows of `allowed_chats` ordered by `created_at` descending.
   */
  async listAllowedChats(): Promise<AllowedChatRow[]> {
    const res = await this.db
      .prepare(
        `SELECT chat_id, added_by, note, created_at
           FROM allowed_chats
          ORDER BY created_at DESC`,
      )
      .all<AllowedChatRow>();

    return res.results ?? [];
  }
}
