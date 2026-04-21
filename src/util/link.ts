/**
 * Builds a direct link to a specific Telegram message.
 *
 * For public groups with a username we use `https://t.me/<username>/<msg>`.
 * For private supergroups we strip the `-100` prefix from `chatId` and use
 * the `https://t.me/c/<internal>/<msg>` form.
 *
 * @param chatId Telegram chat id of the source group.
 * @param messageId Telegram message id to link to.
 * @param username Optional public username of the group.
 * @returns Fully-qualified HTTPS URL.
 */
export function buildPostLink(chatId: number, messageId: number, username?: string | null): string {
  if (username && username.length > 0) {
    return `https://t.me/${username}/${messageId}`;
  }

  const internal = String(chatId).replace(/^-100/, '');

  return `https://t.me/c/${internal}/${messageId}`;
}
