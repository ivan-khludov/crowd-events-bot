import type { Messages } from '../types.js';

/**
 * English message bundle. Acts as the reference for the other locales.
 */
export const en: Messages = {
  event: {
    noDraft: 'Nothing to submit. Reply to a post in the group and mention me.',
    askDate: (format) =>
      "Let's submit an event. Please enter the date and time in the format:\n" +
      `<code>${format}</code>\n` +
      'For example: <code>23.04.2026 19:00</code>',
    invalidDate: (format) =>
      `Could not parse the date. Format must be exactly: <code>${format}</code>`,
    askTitle: 'Great. Now the event title.',
    titleEmpty: 'The title cannot be empty. Please try again.',
    askCity: 'Which city?',
    cityEmpty: 'The city cannot be empty. Please try again.',
    askPlace: 'And the place.',
    placeEmpty: 'The place cannot be empty. Please try again.',
    published: 'Done! The event has been posted in the group.',
  },
  digestBlock: {
    noDraft: 'Nothing to configure. Run /header or /footer in the group first.',
    ask: (field, maxLen) => {
      const position = field === 'header' ? 'above' : 'below';
      const command = field === 'header' ? '/header' : '/footer';

      return (
        `Send one message — its text will appear ${position} the event schedule in the pinned digest. ` +
        'Telegram formatting is preserved: bold, italic, underline, strikethrough, spoiler, ' +
        'monospace, blockquote and hyperlinks.\n\n' +
        `Limit: ${maxLen} characters. Send /cancel to abort ${command}.`
      );
    },
    cancelled: (field) =>
      field === 'header'
        ? 'Cancelled. The header has not been changed.'
        : 'Cancelled. The footer has not been changed.',
    tooLong: (length, max) =>
      `Too long: ${length} characters, limit is ${max}. Please try something shorter.`,
    empty: (field) =>
      field === 'header'
        ? 'The header cannot be empty. Please try again or send /cancel.'
        : 'The footer cannot be empty. Please try again or send /cancel.',
    saveFailed: (field) =>
      field === 'header'
        ? 'Could not save the header. Please try again later.'
        : 'Could not save the footer. Please try again later.',
    saved: (field) =>
      field === 'header'
        ? 'Header saved. Preview of the pinned digest for the current week:'
        : 'Footer saved. Preview of the pinned digest for the current week:',
    howToChange: (field) =>
      field === 'header'
        ? 'To change it — run /header in the group again. To remove it — /clearheader in the group.'
        : 'To change it — run /footer in the group again. To remove it — /clearfooter in the group.',
  },
  start: {
    welcome:
      'Hi! To submit an event — reply to a post in the group and mention me. ' +
      'Group admins can customise the pinned digest with /header and /footer.',
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
    dateTime: ({ day, month, time }) => `${month} ${day}, ${time}`,
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
    settings: ({ chatId, tz, threshold, limit, headerPreview, footerPreview, languageLabel }) =>
      [
        `chat_id: <code>${chatId}</code>`,
        `language: <b>${languageLabel}</b>`,
        `tz: <code>${tz}</code>`,
        `vote_threshold: <b>${threshold}</b>`,
        `daily_limit: <b>${limit}</b>`,
        `digest_header: ${headerPreview}`,
        `digest_footer: ${footerPreview}`,
      ].join('\n'),
    blockPreviewNone: '<i>none</i>',
    blockPreviewSet: (length, snippet) => `<b>set</b>, ${length} chars (<code>${snippet}</code>)`,
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
    headerAskDm:
      "I'll open the header editor in DM. Tap the button below and send me the message that will appear above the event schedule.",
    footerAskDm:
      "I'll open the footer editor in DM. Tap the button below and send me the message that will appear below the event schedule.",
    clearHeaderOk: 'OK: digest header cleared.',
    clearFooterOk: 'OK: digest footer cleared.',
    languageUsage: (current, options) =>
      `Current language: <b>${current}</b>.\nChange it with: <code>/language &lt;code&gt;</code>.\nOptions: ${options}.`,
    languageInvalid: (input, options) =>
      `Unknown language: <code>${input}</code>. Options: ${options}.`,
    languageOk: (name) => `OK: language = ${name}`,
  },
};
