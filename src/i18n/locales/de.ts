import type { Messages } from '../types.js';

/**
 * German message bundle.
 */
export const de: Messages = {
  event: {
    noDraft: 'Nichts zum Einreichen. Antworte auf einen Beitrag in der Gruppe und erwähne mich.',
    askDate: (format) =>
      'Lass uns eine Veranstaltung eintragen. Bitte gib Datum und Uhrzeit im Format ein:\n' +
      `<code>${format}</code>\n` +
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
  digestBlock: {
    noDraft: 'Nichts zu konfigurieren. Führe zuerst /header oder /footer in der Gruppe aus.',
    ask: (field, maxLen) => {
      const position = field === 'header' ? 'über' : 'unter';
      const command = field === 'header' ? '/header' : '/footer';

      return (
        `Sende eine Nachricht — ihr Text erscheint ${position} der Veranstaltungsübersicht im ` +
        'angehefteten Beitrag. Telegram-Formatierung bleibt erhalten: fett, kursiv, unterstrichen, ' +
        'durchgestrichen, Spoiler, Monospace, Zitatblock und Hyperlinks.\n\n' +
        `Limit: ${maxLen} Zeichen. Sende /cancel, um ${command} abzubrechen.`
      );
    },
    cancelled: (field) =>
      field === 'header'
        ? 'Abgebrochen. Der Header wurde nicht geändert.'
        : 'Abgebrochen. Der Footer wurde nicht geändert.',
    tooLong: (length, max) => `Zu lang: ${length} Zeichen, Limit ${max}. Bitte versuche es kürzer.`,
    empty: (field) =>
      field === 'header'
        ? 'Der Header darf nicht leer sein. Bitte versuche es erneut oder sende /cancel.'
        : 'Der Footer darf nicht leer sein. Bitte versuche es erneut oder sende /cancel.',
    saveFailed: (field) =>
      field === 'header'
        ? 'Der Header konnte nicht gespeichert werden. Bitte versuche es später erneut.'
        : 'Der Footer konnte nicht gespeichert werden. Bitte versuche es später erneut.',
    saved: (field) =>
      field === 'header'
        ? 'Header gespeichert. Vorschau des angehefteten Beitrags für diese Woche:'
        : 'Footer gespeichert. Vorschau des angehefteten Beitrags für diese Woche:',
    howToChange: (field) =>
      field === 'header'
        ? 'Zum Ändern — /header erneut in der Gruppe ausführen. Zum Entfernen — /clearheader in der Gruppe.'
        : 'Zum Ändern — /footer erneut in der Gruppe ausführen. Zum Entfernen — /clearfooter in der Gruppe.',
  },
  start: {
    welcome:
      'Hallo! Um eine Veranstaltung einzureichen — antworte auf einen Beitrag in der Gruppe und ' +
      'erwähne mich. Gruppenadmins können den angehefteten Beitrag mit /header und /footer anpassen.',
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
    blockPreviewNone: '<i>keiner</i>',
    blockPreviewSet: (length, snippet) =>
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
    headerAskDm:
      'Ich öffne den Header-Editor im DM. Tippe unten auf die Schaltfläche und sende mir die ' +
      'Nachricht, die über der Veranstaltungsübersicht erscheinen soll.',
    footerAskDm:
      'Ich öffne den Footer-Editor im DM. Tippe unten auf die Schaltfläche und sende mir die ' +
      'Nachricht, die unter der Veranstaltungsübersicht erscheinen soll.',
    clearHeaderOk: 'OK: Header des angehefteten Beitrags gelöscht.',
    clearFooterOk: 'OK: Footer des angehefteten Beitrags gelöscht.',
    languageUsage: (current, options) =>
      `Aktuelle Sprache: <b>${current}</b>.\nÄndern mit: <code>/language &lt;code&gt;</code>.\nOptionen: ${options}.`,
    languageInvalid: (input, options) =>
      `Unbekannte Sprache: <code>${input}</code>. Optionen: ${options}.`,
    languageOk: (name) => `OK: Sprache = ${name}`,
  },
};
