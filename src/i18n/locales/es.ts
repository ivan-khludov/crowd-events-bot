import type { Messages } from '../types.js';

/**
 * Spanish message bundle.
 */
export const es: Messages = {
  event: {
    noDraft: 'Nada que enviar. Responde a una publicación en el grupo y menciónadme.',
    askDate: (format) =>
      'Vamos a registrar el evento. Introduce la fecha y la hora en el formato:\n' +
      `<code>${format}</code>\n` +
      'Por ejemplo: <code>23.04.2026 19:00</code>',
    invalidDate: (format) =>
      `No pude interpretar la fecha. El formato debe ser exactamente: <code>${format}</code>`,
    askTitle: 'Perfecto. Ahora el título del evento.',
    titleEmpty: 'El título no puede estar vacío. Inténtalo de nuevo.',
    askCity: '¿En qué ciudad?',
    cityEmpty: 'La ciudad no puede estar vacía. Inténtalo de nuevo.',
    askPlace: 'Y el lugar.',
    placeEmpty: 'El lugar no puede estar vacío. Inténtalo de nuevo.',
    published: '¡Listo! El evento se ha publicado en el grupo.',
  },
  digestBlock: {
    noDraft: 'Nada que configurar. Ejecuta /header o /footer en el grupo.',
    ask: (field, maxLen) => {
      const position = field === 'header' ? 'sobre' : 'bajo';
      const command = field === 'header' ? '/header' : '/footer';

      return (
        `Envía un mensaje — su texto aparecerá ${position} el resumen de eventos en el mensaje ` +
        'fijado. Se conservará el formato de Telegram: negrita, cursiva, subrayado, tachado, ' +
        'spóiler, monoespaciado, cita y enlaces.\n\n' +
        `Límite: ${maxLen} caracteres. Envía /cancel para cancelar ${command}.`
      );
    },
    cancelled: (field) =>
      field === 'header'
        ? 'Cancelado. La cabecera no se ha cambiado.'
        : 'Cancelado. El pie no se ha cambiado.',
    tooLong: (length, max) =>
      `Demasiado largo: ${length} caracteres, límite ${max}. Prueba con algo más corto.`,
    empty: (field) =>
      field === 'header'
        ? 'La cabecera no puede estar vacía. Inténtalo de nuevo o envía /cancel.'
        : 'El pie no puede estar vacío. Inténtalo de nuevo o envía /cancel.',
    saveFailed: (field) =>
      field === 'header'
        ? 'No se pudo guardar la cabecera. Inténtalo más tarde.'
        : 'No se pudo guardar el pie. Inténtalo más tarde.',
    saved: (field) =>
      field === 'header'
        ? 'Cabecera guardada. Vista previa del mensaje fijado para la semana actual:'
        : 'Pie guardado. Vista previa del mensaje fijado para la semana actual:',
    howToChange: (field) =>
      field === 'header'
        ? 'Para cambiarla — ejecuta /header de nuevo en el grupo. Para quitarla — /clearheader en el grupo.'
        : 'Para cambiarlo — ejecuta /footer de nuevo en el grupo. Para quitarlo — /clearfooter en el grupo.',
  },
  start: {
    welcome:
      '¡Hola! Para proponer un evento — responde a una publicación en el grupo y menciónadme. ' +
      'Los administradores del grupo pueden personalizar el mensaje fijado con /header y /footer.',
  },
  mention: {
    limitReached: (limit) =>
      `Límite diario de ${limit} eventos alcanzado. Inténtalo de nuevo mañana.`,
    invite: (firstName) =>
      `${firstName}, preparemos el evento por mensaje privado — te haré un par de preguntas.`,
    openDmButton: 'Abrir el bot en privado',
  },
  vote: {
    unknownUser: 'No se pudo identificar al usuario.',
    eventNotFound: 'Evento no encontrado.',
    approved: '¡Evento aprobado!',
    recorded: 'Voto registrado.',
  },
  card: {
    originalLinkText: 'Original',
    dateTime: ({ day, month, time }) => `${day} de ${month}, ${time}`,
  },
  digest: {
    empty: 'Aún no hay eventos aprobados.',
    weekHeader: ({ startDay, endDay, startMonth, endMonth, sameMonth }) =>
      sameMonth
        ? `Eventos en las dos próximas semanas: ${startDay}–${endDay} de ${endMonth}`
        : `Eventos en las dos próximas semanas: ${startDay} de ${startMonth} – ${endDay} de ${endMonth}`,
    dayLabel: ({ weekday, day, month }) => `${weekday}, ${day} de ${month}`,
    weekdays: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    months: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
    todayHeader: (n) => (n === 1 ? 'Evento de hoy:' : 'Eventos de hoy:'),
    todayEmpty: 'Hoy no hay eventos.',
  },
  admin: {
    onlyGroup: 'Este comando solo está disponible en un chat de grupo.',
    onlyAdmin: 'Este comando solo está disponible para los administradores del grupo.',
    checkFailed: 'No se pudieron comprobar los permisos. Inténtalo más tarde.',
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
    blockPreviewNone: '<i>ninguno</i>',
    blockPreviewSet: (length, snippet) =>
      `<b>definido</b>, ${length} car. (<code>${snippet}</code>)`,
    thresholdUsage: (min, max) =>
      `Uso: <code>/threshold N</code>, donde ${min} ≤ N ≤ ${max}. Ejemplo: /threshold 15`,
    thresholdOk: (value) => `OK: vote_threshold = ${value}`,
    limitUsage: (min, max) =>
      `Uso: <code>/limit N</code>, donde ${min} ≤ N ≤ ${max}. Ejemplo: /limit 5`,
    limitOk: (value) => `OK: daily_limit = ${value}`,
    tzCurrent: (tz) =>
      [
        `Zona horaria actual: <code>${tz}</code>.`,
        'Cambiar con: <code>/timezone &lt;IANA&gt;</code>.',
        'Ejemplos: <code>Europe/Moscow</code>, <code>Europe/Berlin</code>, <code>Asia/Tbilisi</code>, <code>America/New_York</code>.',
        'Lista completa: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
      ].join('\n'),
    tzInvalid: (input) =>
      `No parece un identificador IANA válido: <code>${input}</code>. ` +
      'Prueba alguno de https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
    tzOk: (tz, time, day) => `OK: zona horaria = <code>${tz}</code> (ahora ${time}, ${day}).`,
    headerAskDm:
      'Abriré el editor de la cabecera en privado. Pulsa el botón de abajo y envíame el mensaje que ' +
      'aparecerá sobre el resumen de eventos.',
    footerAskDm:
      'Abriré el editor del pie en privado. Pulsa el botón de abajo y envíame el mensaje que ' +
      'aparecerá bajo el resumen de eventos.',
    clearHeaderOk: 'OK: cabecera del mensaje fijado eliminada.',
    clearFooterOk: 'OK: pie del mensaje fijado eliminado.',
    languageUsage: (current, options) =>
      `Idioma actual: <b>${current}</b>.\nCambiar con: <code>/language &lt;code&gt;</code>.\nOpciones: ${options}.`,
    languageInvalid: (input, options) =>
      `Idioma desconocido: <code>${input}</code>. Opciones: ${options}.`,
    languageOk: (name) => `OK: idioma = ${name}`,
  },
};
