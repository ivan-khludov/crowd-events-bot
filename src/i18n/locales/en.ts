import type { Messages } from '../types.js';

/**
 * English message bundle. Acts as the reference for the other locales.
 */
export const en: Messages = {
  event: {
    noDraft: 'Nothing to submit. Reply to a post in the group and mention me.',
    askDate: (format, tz) =>
      "Let's submit an event. Please enter the date and time in the format:\n" +
      `<code>${format}</code>\n` +
      `timezone: <code>${tz}</code>\n` +
      'For example: <code>23.04.2026 19:00</code>',
    invalidDate: (format) =>
      `Could not parse the date. Format must be exactly: <code>${format}</code>`,
    askTitle: 'Great. Now the event title.',
    titleEmpty: 'The title cannot be empty. Please try again.',
    askPlace: 'And the place.',
    placeEmpty: 'The place cannot be empty. Please try again.',
    published: 'Done! The event has been posted in the group.',
  },
  prefix: {
    noDraft: 'Nothing to configure. Run /prefix in the group first.',
    ask: (maxLen) =>
      'Send one message — its text will appear above the event schedule in the pinned digest. ' +
      'Telegram formatting is preserved: bold, italic, underline, strikethrough, spoiler, ' +
      'monospace, blockquote and hyperlinks.\n\n' +
      `Limit: ${maxLen} characters. Send /cancel to abort.`,
    cancelled: 'Cancelled. The prefix has not been changed.',
    tooLong: (length, max) =>
      `Too long: ${length} characters, limit is ${max}. Please try something shorter.`,
    empty: 'The prefix cannot be empty. Please try again or send /cancel.',
    saveFailed: 'Could not save the prefix. Please try again later.',
    saved: 'Prefix saved. Preview of the pinned digest for the current week:',
    previewHeader: '',
    howToChange:
      'To change it — run /prefix in the group again. To remove it — /clearprefix in the group.',
  },
  start: {
    welcome:
      'Hi! To submit an event — reply to a post in the group and mention me. ' +
      'Group admins can customise the digest prefix with /prefix.',
  },
  mention: {
    limitReached: (limit) => `Daily limit of ${limit} events reached. Please try again tomorrow.`,
    invite: (firstName) =>
      `${firstName}, let's set up the event in DM — I'll ask you a couple of questions.`,
    openDmButton: 'Open the bot in DM',
  },
  vote: {
    unknownUser: 'Could not identify the user.',
    eventNotFound: 'Event not found.',
    approved: 'Event approved!',
    recorded: 'Vote recorded.',
  },
  card: {
    originalLinkText: 'Original',
  },
  digest: {
    empty: 'No approved events yet.',
    weekHeader: ({ startDay, endDay, startMonth, endMonth, sameMonth }) =>
      sameMonth
        ? `Events this week: ${startMonth} ${startDay}–${endDay}`
        : `Events this week: ${startMonth} ${startDay} – ${endMonth} ${endDay}`,
    dayLabel: ({ weekday, day, month }) => `${weekday}, ${month} ${day}`,
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    todayHeader: 'Events today:',
    todayEmpty: 'No events today.',
  },
  admin: {
    onlyGroup: 'This command is only available in a group chat.',
    onlyAdmin: 'This command is only available to group admins.',
    checkFailed: 'Could not verify your permissions. Please try again later.',
    settings: ({ chatId, tz, threshold, limit, prefixPreview, languageLabel }) =>
      [
        `chat_id: <code>${chatId}</code>`,
        `language: <b>${languageLabel}</b>`,
        `tz: <code>${tz}</code>`,
        `vote_threshold: <b>${threshold}</b>`,
        `daily_limit: <b>${limit}</b>`,
        `digest_prefix: ${prefixPreview}`,
      ].join('\n'),
    prefixPreviewNone: '<i>none</i>',
    prefixPreviewSet: (length, snippet) => `<b>set</b>, ${length} chars (<code>${snippet}</code>)`,
    thresholdUsage: (min, max) =>
      `Usage: <code>/threshold N</code>, where ${min} ≤ N ≤ ${max}. Example: /threshold 15`,
    thresholdOk: (value) => `OK: vote_threshold = ${value}`,
    limitUsage: (min, max) =>
      `Usage: <code>/limit N</code>, where ${min} ≤ N ≤ ${max}. Example: /limit 5`,
    limitOk: (value) => `OK: daily_limit = ${value}`,
    tzCurrent: (tz) =>
      [
        `Current timezone: <code>${tz}</code>.`,
        'Change it with: <code>/timezone &lt;IANA&gt;</code>.',
        'Examples: <code>Europe/Moscow</code>, <code>Europe/Berlin</code>, <code>Asia/Tbilisi</code>, <code>America/New_York</code>.',
        'Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
      ].join('\n'),
    tzInvalid: (input) =>
      `That doesn't look like a valid IANA identifier: <code>${input}</code>. ` +
      'Try something from https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
    tzOk: (tz, time, day) => `OK: timezone = <code>${tz}</code> (now ${time}, ${day}).`,
    prefixAskDm:
      "I'll open the prefix editor in DM. Tap the button below and send me the message that will appear above the event schedule.",
    clearPrefixOk: 'OK: digest prefix cleared.',
    languageUsage: (current, options) =>
      `Current language: <b>${current}</b>.\nChange it with: <code>/language &lt;code&gt;</code>.\nOptions: ${options}.`,
    languageInvalid: (input, options) =>
      `Unknown language: <code>${input}</code>. Options: ${options}.`,
    languageOk: (name) => `OK: language = ${name}`,
  },
};
