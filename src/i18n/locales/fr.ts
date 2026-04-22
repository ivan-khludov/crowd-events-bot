import type { Messages } from '../types.js';

/**
 * French message bundle.
 */
export const fr: Messages = {
  event: {
    noDraft: 'Rien à soumettre. Répondez à un message dans le groupe et mentionnez-moi.',
    askDate: (format) =>
      "Créons l'événement. Veuillez saisir la date et l'heure au format :\n" +
      `<code>${format}</code>\n` +
      'Par exemple : <code>23.04.2026 19:00</code>',
    invalidDate: (format) =>
      `Date non comprise. Le format doit être strictement : <code>${format}</code>`,
    askTitle: "Parfait. Maintenant le titre de l'événement.",
    titleEmpty: 'Le titre ne peut pas être vide. Veuillez réessayer.',
    askCity: 'Dans quelle ville ?',
    cityEmpty: 'La ville ne peut pas être vide. Veuillez réessayer.',
    askPlace: 'Et le lieu.',
    placeEmpty: 'Le lieu ne peut pas être vide. Veuillez réessayer.',
    published: "Terminé ! L'événement a été publié dans le groupe.",
  },
  digestBlock: {
    noDraft: 'Rien à configurer. Lancez /header ou /footer dans le groupe.',
    ask: (field, maxLen) => {
      const position = field === 'header' ? 'au-dessus du' : 'sous le';
      const command = field === 'header' ? '/header' : '/footer';

      return (
        `Envoyez un seul message — son texte apparaîtra ${position} programme des événements dans ` +
        'le message épinglé. Le formatage Telegram est préservé : gras, italique, souligné, barré, ' +
        'spoiler, chasse fixe, bloc de citation et liens hypertexte.\n\n' +
        `Limite : ${maxLen} caractères. Envoyez /cancel pour annuler ${command}.`
      );
    },
    cancelled: (field) =>
      field === 'header' ? 'Annulé. L\u2019en-tête est inchangé.' : 'Annulé. Le pied est inchangé.',
    tooLong: (length, max) =>
      `Trop long : ${length} caractères, limite ${max}. Essayez plus court.`,
    empty: (field) =>
      field === 'header'
        ? 'L\u2019en-tête ne peut pas être vide. Veuillez réessayer ou envoyer /cancel.'
        : 'Le pied ne peut pas être vide. Veuillez réessayer ou envoyer /cancel.',
    saveFailed: (field) =>
      field === 'header'
        ? "Impossible d'enregistrer l\u2019en-tête. Veuillez réessayer plus tard."
        : "Impossible d'enregistrer le pied. Veuillez réessayer plus tard.",
    saved: (field) =>
      field === 'header'
        ? 'En-tête enregistré. Aperçu du message épinglé pour la semaine en cours :'
        : 'Pied enregistré. Aperçu du message épinglé pour la semaine en cours :',
    howToChange: (field) =>
      field === 'header'
        ? 'Pour le modifier — relancez /header dans le groupe. Pour le supprimer — /clearheader dans le groupe.'
        : 'Pour le modifier — relancez /footer dans le groupe. Pour le supprimer — /clearfooter dans le groupe.',
  },
  start: {
    welcome:
      'Bonjour ! Pour proposer un événement — répondez à un message du groupe et mentionnez-moi. ' +
      'Les administrateurs peuvent personnaliser le message épinglé avec /header et /footer.',
  },
  mention: {
    limitReached: (limit) =>
      `Limite quotidienne de ${limit} événements atteinte. Réessayez demain.`,
    invite: (firstName) =>
      `${firstName}, créons l'événement en privé — je vais vous poser quelques questions.`,
    openDmButton: 'Ouvrir le bot en privé',
  },
  vote: {
    unknownUser: "Impossible d'identifier l'utilisateur.",
    eventNotFound: 'Événement introuvable.',
    approved: 'Événement approuvé !',
    recorded: 'Vote enregistré.',
  },
  card: {
    originalLinkText: 'Original',
    dateTime: ({ day, month, time }) => `${day} ${month}, ${time}`,
  },
  digest: {
    empty: 'Aucun événement approuvé pour le moment.',
    weekHeader: ({ startDay, endDay, startMonth, endMonth, sameMonth }) =>
      sameMonth
        ? `Événements cette semaine : ${startDay}–${endDay} ${endMonth}`
        : `Événements cette semaine : ${startDay} ${startMonth} – ${endDay} ${endMonth}`,
    dayLabel: ({ weekday, day, month }) => `${weekday} ${day} ${month}`,
    weekdays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
    months: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
    todayHeader: "Événements aujourd'hui :",
    todayEmpty: "Aucun événement aujourd'hui.",
  },
  admin: {
    onlyGroup: 'Cette commande est disponible uniquement dans un chat de groupe.',
    onlyAdmin: 'Cette commande est disponible uniquement pour les administrateurs du groupe.',
    checkFailed: 'Impossible de vérifier vos droits. Veuillez réessayer plus tard.',
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
    blockPreviewNone: '<i>aucun</i>',
    blockPreviewSet: (length, snippet) => `<b>défini</b>, ${length} car. (<code>${snippet}</code>)`,
    thresholdUsage: (min, max) =>
      `Utilisation : <code>/threshold N</code>, où ${min} ≤ N ≤ ${max}. Exemple : /threshold 15`,
    thresholdOk: (value) => `OK : vote_threshold = ${value}`,
    limitUsage: (min, max) =>
      `Utilisation : <code>/limit N</code>, où ${min} ≤ N ≤ ${max}. Exemple : /limit 5`,
    limitOk: (value) => `OK : daily_limit = ${value}`,
    tzCurrent: (tz) =>
      [
        `Fuseau horaire actuel : <code>${tz}</code>.`,
        'Changer avec : <code>/timezone &lt;IANA&gt;</code>.',
        'Exemples : <code>Europe/Moscow</code>, <code>Europe/Berlin</code>, <code>Asia/Tbilisi</code>, <code>America/New_York</code>.',
        'Liste complète : https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
      ].join('\n'),
    tzInvalid: (input) =>
      `Cela ne ressemble pas à un identifiant IANA valide : <code>${input}</code>. ` +
      'Essayez quelque chose depuis https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
    tzOk: (tz, time, day) =>
      `OK : fuseau horaire = <code>${tz}</code> (maintenant ${time}, ${day}).`,
    headerAskDm:
      "J'ouvre l'éditeur d'en-tête en privé. Cliquez sur le bouton ci-dessous et envoyez-moi le " +
      'message qui apparaîtra au-dessus du programme des événements.',
    footerAskDm:
      "J'ouvre l'éditeur de pied en privé. Cliquez sur le bouton ci-dessous et envoyez-moi le " +
      'message qui apparaîtra sous le programme des événements.',
    clearHeaderOk: 'OK : en-tête du message épinglé supprimé.',
    clearFooterOk: 'OK : pied du message épinglé supprimé.',
    languageUsage: (current, options) =>
      `Langue actuelle : <b>${current}</b>.\nChanger avec : <code>/language &lt;code&gt;</code>.\nOptions : ${options}.`,
    languageInvalid: (input, options) =>
      `Langue inconnue : <code>${input}</code>. Options : ${options}.`,
    languageOk: (name) => `OK : langue = ${name}`,
  },
};
