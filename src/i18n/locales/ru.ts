import type { Messages } from '../types.js';

/**
 * Russian message bundle. Kept closest to the original copy that lived in the
 * handlers before localization.
 */
export const ru: Messages = {
  event: {
    noDraft: 'Нечего оформлять. Ответьте на пост в группе и упомяните меня.',
    askDate: (format, tz) =>
      'Давайте оформим событие. Введите дату и время в формате:\n' +
      `<code>${format}</code>\n` +
      `по времени: <code>${tz}</code>\n` +
      'Например: <code>23.04.2026 19:00</code>',
    invalidDate: (format) => `Не понял дату. Формат строго: <code>${format}</code>`,
    askTitle: 'Отлично. Теперь название события.',
    titleEmpty: 'Название не может быть пустым. Попробуйте ещё раз.',
    askPlace: 'И место.',
    placeEmpty: 'Место не может быть пустым. Попробуйте ещё раз.',
    published: 'Готово! Событие опубликовано в группе.',
  },
  prefix: {
    noDraft: 'Нечего настраивать. Запустите /prefix в группе.',
    ask: (maxLen) =>
      'Пришлите одно сообщение — его текст будет отображаться над сводкой событий в закрепе. ' +
      'Форматирование Telegram сохранится: жирный, курсив, подчёркивание, зачёркнутый, ' +
      'спойлер, моноширинный, блок цитаты и гиперссылки.\n\n' +
      `Лимит: ${maxLen} символов. Отправьте /cancel, чтобы отменить.`,
    cancelled: 'Отменено. Префикс не изменён.',
    tooLong: (length, max) =>
      `Слишком длинно: ${length} символов, лимит ${max}. Попробуйте короче.`,
    empty: 'Префикс не может быть пустым. Попробуйте ещё раз или отправьте /cancel.',
    saveFailed: 'Не удалось сохранить префикс. Попробуйте позже.',
    saved: 'Префикс сохранён. Превью закрепа на текущую неделю:',
    previewHeader: '',
    howToChange: 'Чтобы изменить — снова /prefix в группе. Чтобы убрать — /clearprefix в группе.',
  },
  start: {
    welcome:
      'Привет! Чтобы предложить событие — ответьте на пост в группе и упомяните меня. ' +
      'Админы групп могут настроить префикс закрепа командой /prefix.',
  },
  mention: {
    limitReached: (limit) => `Лимит ${limit} событий в день исчерпан. Попробуйте завтра.`,
    invite: (firstName) => `${firstName}, оформим событие в личке — я задам пару вопросов.`,
    openDmButton: 'Открыть бота в ЛС',
  },
  vote: {
    unknownUser: 'Не удалось определить пользователя.',
    eventNotFound: 'Событие не найдено.',
    approved: 'Событие одобрено!',
    recorded: 'Голос учтён.',
  },
  card: {
    originalLinkText: 'Оригинал',
    dateTime: ({ day, month, time }) => `${day} ${month}, ${time}`,
  },
  digest: {
    empty: 'Пока нет подтверждённых событий.',
    weekHeader: ({ startDay, endDay, startMonth, endMonth, sameMonth }) =>
      sameMonth
        ? `События на неделе: ${startDay}–${endDay} ${endMonth}`
        : `События на неделе: ${startDay} ${startMonth} – ${endDay} ${endMonth}`,
    dayLabel: ({ weekday, day, month }) => `${weekday}, ${day} ${month}`,
    weekdays: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
    months: [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ],
    todayHeader: 'Событие сегодня:',
    todayEmpty: 'На сегодня событий нет.',
  },
  admin: {
    onlyGroup: 'Команда доступна только в групповом чате.',
    onlyAdmin: 'Команда доступна только админам группы.',
    checkFailed: 'Не удалось проверить права. Попробуйте позже.',
    settings: ({ chatId, tz, threshold, limit, prefixPreview, languageLabel }) =>
      [
        `chat_id: <code>${chatId}</code>`,
        `language: <b>${languageLabel}</b>`,
        `tz: <code>${tz}</code>`,
        `vote_threshold: <b>${threshold}</b>`,
        `daily_limit: <b>${limit}</b>`,
        `digest_prefix: ${prefixPreview}`,
      ].join('\n'),
    prefixPreviewNone: '<i>нет</i>',
    prefixPreviewSet: (length, snippet) => `<b>задан</b>, ${length} симв (<code>${snippet}</code>)`,
    thresholdUsage: (min, max) =>
      `Использование: <code>/threshold N</code>, где ${min} ≤ N ≤ ${max}. Пример: /threshold 15`,
    thresholdOk: (value) => `OK: vote_threshold = ${value}`,
    limitUsage: (min, max) =>
      `Использование: <code>/limit N</code>, где ${min} ≤ N ≤ ${max}. Пример: /limit 5`,
    limitOk: (value) => `OK: daily_limit = ${value}`,
    tzCurrent: (tz) =>
      [
        `Текущая таймзона: <code>${tz}</code>.`,
        'Поменять: <code>/timezone &lt;IANA&gt;</code>.',
        'Примеры: <code>Europe/Moscow</code>, <code>Europe/Berlin</code>, <code>Asia/Tbilisi</code>, <code>America/New_York</code>.',
        'Полный список: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
      ].join('\n'),
    tzInvalid: (input) =>
      `Не похоже на корректный IANA-идентификатор: <code>${input}</code>. ` +
      'Попробуйте что-то из https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
    tzOk: (tz, time, day) => `OK: таймзона = <code>${tz}</code> (сейчас ${time}, ${day}).`,
    prefixAskDm:
      'Открою редактор префикса в личке. Нажмите кнопку ниже и пришлите мне сообщение, которое ' +
      'будет показываться над сводкой событий.',
    clearPrefixOk: 'OK: префикс закрепа очищен.',
    languageUsage: (current, options) =>
      `Текущий язык: <b>${current}</b>.\nПоменять: <code>/language &lt;code&gt;</code>.\nОпции: ${options}.`,
    languageInvalid: (input, options) =>
      `Неизвестный язык: <code>${input}</code>. Опции: ${options}.`,
    languageOk: (name) => `OK: язык = ${name}`,
  },
};
