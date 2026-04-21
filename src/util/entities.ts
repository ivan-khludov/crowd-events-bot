import { escapeHtml } from './render.js';

/**
 * Minimal subset of Telegram `MessageEntity` that the converter needs. We
 * keep a local interface instead of pulling `grammy-types` in here so the
 * converter stays pure and trivially unit-testable.
 */
export interface InputEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: { id: number };
  language?: string;
}

/**
 * Converts Telegram `text + entities` into a Telegram-flavoured HTML string
 * suitable for `parse_mode: 'HTML'`.
 *
 * Offsets are interpreted as UTF-16 code unit indices, matching the Bot API
 * contract. Only a safe subset of entity types emits tags; unsupported ones
 * (plain `url`, `mention`, `hashtag`, etc.) fall through as escaped text.
 *
 * Entities are assumed to be well-formed (strictly nested or disjoint), which
 * is the case for anything produced by official Telegram clients.
 *
 * @param text Raw message text.
 * @param entities Optional entity array from the message.
 * @returns HTML-safe string.
 */
export function entitiesToHtml(text: string, entities: InputEntity[] | undefined): string {
  if (!entities || entities.length === 0) {
    return escapeHtml(text);
  }

  const n = text.length;

  const opens: string[][] = Array.from({ length: n + 1 }, () => []);
  const closes: string[][] = Array.from({ length: n + 1 }, () => []);

  const sorted = [...entities].sort((a, b) => {
    if (a.offset !== b.offset) {
      return a.offset - b.offset;
    }

    return b.offset + b.length - (a.offset + a.length);
  });

  const boundaries = new Set<number>([0, n]);

  for (const e of sorted) {
    const pair = entityTags(e);

    if (!pair) {
      continue;
    }

    if (e.offset < 0 || e.offset + e.length > n || e.length <= 0) {
      continue;
    }

    const startBucket = opens[e.offset];
    const endBucket = closes[e.offset + e.length];

    if (!startBucket || !endBucket) {
      continue;
    }

    startBucket.push(pair.open);
    endBucket.unshift(pair.close);
    boundaries.add(e.offset);
    boundaries.add(e.offset + e.length);
  }

  const points = [...boundaries].sort((a, b) => a - b);
  const out: string[] = [];

  for (let i = 0; i < points.length; i++) {
    const pos = points[i] ?? 0;

    for (const c of closes[pos] ?? []) {
      out.push(c);
    }

    for (const o of opens[pos] ?? []) {
      out.push(o);
    }

    const next = points[i + 1];

    if (typeof next === 'number') {
      out.push(escapeHtml(text.slice(pos, next)));
    }
  }

  return out.join('');
}

/**
 * Maps a supported Telegram `MessageEntity` to its open/close HTML tag pair.
 *
 * @param e Candidate entity.
 * @returns Pair of tag strings, or `null` to skip this entity.
 */
function entityTags(e: InputEntity): { open: string; close: string } | null {
  switch (e.type) {
    case 'bold':
      return { open: '<b>', close: '</b>' };
    case 'italic':
      return { open: '<i>', close: '</i>' };
    case 'underline':
      return { open: '<u>', close: '</u>' };
    case 'strikethrough':
      return { open: '<s>', close: '</s>' };
    case 'spoiler':
      return { open: '<span class="tg-spoiler">', close: '</span>' };
    case 'code':
      return { open: '<code>', close: '</code>' };
    case 'pre':
      return { open: '<pre>', close: '</pre>' };
    case 'blockquote':
      return { open: '<blockquote>', close: '</blockquote>' };
    case 'expandable_blockquote':
      return { open: '<blockquote expandable>', close: '</blockquote>' };
    case 'text_link':
      if (!e.url) {
        return null;
      }

      return { open: `<a href="${escapeHtml(e.url)}">`, close: '</a>' };
    case 'text_mention':
      if (!e.user) {
        return null;
      }

      return { open: `<a href="tg://user?id=${e.user.id}">`, close: '</a>' };
    default:
      return null;
  }
}
