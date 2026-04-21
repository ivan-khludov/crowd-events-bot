import type { Messages } from '../types.js';

/**
 * German message bundle.
 */
export const de: Messages = {
  event: {
    noDraft: 'Nichts zum Einreichen. Antworte auf einen Beitrag in der Gruppe und erwähne mich.',
    askDate: (format, tz) =>
      'Lass uns eine Veranstaltung eintragen. Bitte gib Datum und Uhrzeit im Format ein:\n' +
      `<code>${format}</code>\n` +
      `Zeitzone: <code>${tz}</code>\n` +
      'Zum Beispiel: <code>23.04.2026 19:00</code>',
    invalidDate: (format) =>
      `Datum konnte nicht gelesen werden. Format muss genau sein: <code>${format}</code>`,
    askTitle: 'Super. Jetzt der Titel der Veranstaltung.',
    titleEmpty: 'Der Titel darf nicht leer sein. Bitte versuche es erneut.',
    askCity: 'In welcher Stadt?',
    cityEmpty: 'Die Stadt darf nicht leer sein. Bitte versuche es erneut.',
    askPlace: 'Und der Ort.',
    placeEmpty: 'Der Ort darf nicht leer sein. Bitte versuche es erneut.',
    published: 'Fertig! Die Veranstaltung wurde in der Gruppe veröffentlicht.',
  },
  prefix: {
    noDraft: 'Nichts zu konfigurieren. Führe zuerst /prefix in der Gruppe aus.',
    ask: (maxLen) =>
      'Sende eine Nachricht — ihr Text erscheint über der Veranstaltungsübersicht im angehefteten ' +
      'Beitrag. Telegram-Formatierung bleibt erhalten: fett, kursiv, unterstrichen, durchgestrichen, ' +
      'Spoiler, Monospace, Zitatblock und Hyperlinks.\n\n' +
      `Limit: ${maxLen} Zeichen. Sende /cancel zum Abbrechen.`,
    cancelled: 'Abgebrochen. Der Prefix wurde nicht geändert.',
    tooLong: (length, max) => `Zu lang: ${length} Zeichen, Limit ${max}. Bitte versuche es kürzer.`,
    empty: 'Der Prefix darf nicht leer sein. Bitte versuche es erneut oder sende /cancel.',
    saveFailed: 'Der Prefix konnte nicht gespeichert werden. Bitte versuche es später erneut.',
    saved: 'Prefix gespeichert. Vorschau des angehefteten Beitrags für diese Woche:',
    previewHeader: '',
    howToChange:
      'Zum Ändern — /prefix erneut in der Gruppe ausführen. Zum Entfernen — /clearprefix in der Gruppe.',
  },
  start: {
    welcome:
      'Hallo! Um eine Veranstaltung einzureichen — antworte auf einen Beitrag in der Gruppe und ' +
      'erwähne mich. Gruppenadmins können den Prefix des angehefteten Beitrags mit /prefix anpassen.',
  },
  mention: {
    limitReached: (limit) =>
      `Tageslimit von ${limit} Veranstaltungen erreicht. Bitte versuche es morgen erneut.`,
    invite: (firstName) =>
      `${firstName}, wir richten die Veranstaltung per DM ein — ich stelle dir ein paar Fragen.`,
    openDmButton: 'Bot im DM öffnen',
  },
  vote: {
    unknownUser: 'Der Benutzer konnte nicht identifiziert werden.',
    eventNotFound: 'Veranstaltung nicht gefunden.',
    approved: 'Veranstaltung genehmigt!',
    recorded: 'Stimme gezählt.',
  },
  card: {
    originalLinkText: 'Original',
    dateTime: ({ day, month, time }) => `${day}. ${month}, ${time}`,
  },
  digest: {
    empty: 'Noch keine genehmigten Veranstaltungen.',
    weekHeader: ({ startDay, endDay, startMonth, endMonth, sameMonth }) =>
      sameMonth
        ? `Veranstaltungen diese Woche: ${startDay}.–${endDay}. ${endMonth}`
        : `Veranstaltungen diese Woche: ${startDay}. ${startMonth} – ${endDay}. ${endMonth}`,
    dayLabel: ({ weekday, day, month }) => `${weekday}, ${day}. ${month}`,
    weekdays: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    months: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
    todayHeader: 'Veranstaltungen heute:',
    todayEmpty: 'Keine Veranstaltungen heute.',
  },
  admin: {
    onlyGroup: 'Dieser Befehl ist nur in einem Gruppenchat verfügbar.',
    onlyAdmin: 'Dieser Befehl ist nur für Gruppenadministratoren verfügbar.',
    checkFailed: 'Berechtigungen konnten nicht geprüft werden. Bitte versuche es später erneut.',
    settings: ({ chatId, tz, threshold, limit, prefixPreview, languageLabel }) =>
      [
        `chat_id: <code>${chatId}</code>`,
        `language: <b>${languageLabel}</b>`,
        `tz: <code>${tz}</code>`,
        `vote_threshold: <b>${threshold}</b>`,
        `daily_limit: <b>${limit}</b>`,
        `digest_prefix: ${prefixPreview}`,
      ].join('\n'),
    prefixPreviewNone: '<i>keiner</i>',
    prefixPreviewSet: (length, snippet) =>
      `<b>gesetzt</b>, ${length} Zeichen (<code>${snippet}</code>)`,
    thresholdUsage: (min, max) =>
      `Verwendung: <code>/threshold N</code>, wobei ${min} ≤ N ≤ ${max}. Beispiel: /threshold 15`,
    thresholdOk: (value) => `OK: vote_threshold = ${value}`,
    limitUsage: (min, max) =>
      `Verwendung: <code>/limit N</code>, wobei ${min} ≤ N ≤ ${max}. Beispiel: /limit 5`,
    limitOk: (value) => `OK: daily_limit = ${value}`,
    tzCurrent: (tz) =>
      [
        `Aktuelle Zeitzone: <code>${tz}</code>.`,
        'Ändern mit: <code>/timezone &lt;IANA&gt;</code>.',
        'Beispiele: <code>Europe/Moscow</code>, <code>Europe/Berlin</code>, <code>Asia/Tbilisi</code>, <code>America/New_York</code>.',
        'Vollständige Liste: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
      ].join('\n'),
    tzInvalid: (input) =>
      `Das sieht nicht nach einer gültigen IANA-Kennung aus: <code>${input}</code>. ` +
      'Versuche etwas von https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
    tzOk: (tz, time, day) => `OK: Zeitzone = <code>${tz}</code> (jetzt ${time}, ${day}).`,
    prefixAskDm:
      'Ich öffne den Prefix-Editor im DM. Tippe unten auf die Schaltfläche und sende mir die ' +
      'Nachricht, die über der Veranstaltungsübersicht erscheinen soll.',
    clearPrefixOk: 'OK: Prefix des angehefteten Beitrags gelöscht.',
    languageUsage: (current, options) =>
      `Aktuelle Sprache: <b>${current}</b>.\nÄndern mit: <code>/language &lt;code&gt;</code>.\nOptionen: ${options}.`,
    languageInvalid: (input, options) =>
      `Unbekannte Sprache: <code>${input}</code>. Optionen: ${options}.`,
    languageOk: (name) => `OK: Sprache = ${name}`,
  },
};
