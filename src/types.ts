/**
 * Lifecycle status of a submitted event. Events start as `pending` and become
 * `approved` once the per-group vote threshold is reached.
 */
export type EventStatus = 'pending' | 'approved';

/**
 * Direction of a user's vote on an event card.
 */
export type VoteType = 'up' | 'down';

/**
 * Per-group configuration persisted in the `groups` table.
 */
export interface GroupRow {
  chat_id: number;
  username: string | null;
  title: string | null;
  vote_threshold: number;
  daily_limit: number;
  pinned_digest_message_id: number | null;
  last_digest_week_start: string | null;
  tz: string;
  digest_prefix: string | null;
  language: string;
  last_daily_digest_day: string | null;
}

/**
 * A community-submitted event row from the `events` table.
 */
export interface EventRow {
  id: string;
  group_chat_id: number;
  creator_id: number;
  original_message_id: number;
  title: string;
  city: string;
  place: string;
  datetime_utc: string;
  status: EventStatus;
  vote_message_id: number | null;
  votes_up: number;
  votes_down: number;
  created_at: string;
}

/**
 * Conversation starting payload for the event-submission flow. Saved in D1
 * when the user mentions the bot in a group and consumed when the same user
 * first writes to the bot in DM.
 */
export interface EventDraft {
  originalChatId: number;
  originalMessageId: number;
  groupChatId: number;
  groupUsername: string | null;
  creatorId: number;
  tz: string;
  locale: string;
  /**
   * When `true`, the mention handler has already asked the very first
   * conversation question (date/time) directly in DM, so the conversation
   * must skip its initial prompt and wait for the user's reply straight away.
   */
  primed?: boolean;
}

/**
 * Conversation starting payload for the pinned-digest prefix editor. Saved
 * when an admin runs `/prefix` in a group so the DM kickoff can enter the
 * prefix conversation for the correct group.
 */
export interface PrefixDraft {
  groupChatId: number;
  creatorId: number;
  tz: string;
  locale: string;
}

/**
 * Discriminated union of all draft kinds persisted in the `sessions` table
 * under the `pending:` key. The DM kickoff inspects `kind` to route the user
 * into the matching conversation.
 */
export type PendingDraft = ({ kind: 'event' } & EventDraft) | ({ kind: 'prefix' } & PrefixDraft);

/**
 * Row of the `allowed_chats` allowlist table. Only chat ids present here are
 * served by the bot; everything else is auto-left on sight.
 */
export interface AllowedChatRow {
  chat_id: number;
  added_by: number;
  note: string | null;
  created_at: string;
}
