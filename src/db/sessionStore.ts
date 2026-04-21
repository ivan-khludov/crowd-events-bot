import type { StorageAdapter } from 'grammy';

/**
 * grammY `StorageAdapter` implementation backed by a D1 `sessions` table.
 *
 * Values are serialised as JSON. The adapter is generic over the concrete
 * session shape so it can be reused by both the plain session middleware
 * and the conversations plugin.
 *
 * @template T Session payload type.
 */
export class D1SessionStorage<T> implements StorageAdapter<T> {
  /**
   * Creates an adapter bound to a specific D1 database.
   *
   * @param db D1 database binding from the worker environment.
   */
  constructor(private readonly db: D1Database) {}

  /**
   * Reads a session payload by key.
   *
   * @param key Session key (typically `${chatId}` or `${chatId}:${userId}`).
   * @returns Parsed payload or `undefined` if absent.
   */
  async read(key: string): Promise<T | undefined> {
    const row = await this.db
      .prepare(`SELECT value FROM sessions WHERE key = ?1`)
      .bind(key)
      .first<{ value: string }>();

    if (!row) {return undefined;}

    return JSON.parse(row.value) as T;
  }

  /**
   * Writes (upserts) a session payload.
   *
   * @param key Session key.
   * @param value Payload to persist.
   */
  async write(key: string, value: T): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO sessions (key, value)
             VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET
             value      = excluded.value,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
      )
      .bind(key, JSON.stringify(value))
      .run();
  }

  /**
   * Deletes a session payload.
   *
   * @param key Session key to remove.
   */
  async delete(key: string): Promise<void> {
    await this.db.prepare(`DELETE FROM sessions WHERE key = ?1`).bind(key).run();
  }
}
