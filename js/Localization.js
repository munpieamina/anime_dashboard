const TITLE_MAP = Object.freeze({
  1: 'Ковбой Бибоп',
  20: 'Наруто',
  21: 'Ван-Пис',
  1535: 'Тетрадь смерти',
  5114: 'Стальной алхимик: Братство',
  9253: 'Врата Штейна',
  11061: 'Охотник х Охотник (2011)',
  16498: 'Атака титанов',
  30276: 'Ванпанчмен',
  38000: 'Клинок, рассекающий демонов',
  40748: 'Магическая битва',
  50265: 'Семья шпиона',
  52991: 'Фрирен, провожающая в последний путь',
  59978: 'Фрирен, провожающая в последний путь 2',
});

const GENRE_MAP = Object.freeze({
  Action: 'Экшен',
  Adventure: 'Приключения',
  Comedy: 'Комедия',
  Drama: 'Драма',
  Fantasy: 'Фэнтези',
  Horror: 'Ужасы',
  Mystery: 'Детектив',
  Psychological: 'Психология',
  Romance: 'Романтика',
  'Sci-Fi': 'Научная фантастика',
  School: 'Школа',
  Sports: 'Спорт',
  Supernatural: 'Сверхъестественное',
  Suspense: 'Саспенс',
  Thriller: 'Триллер',
  'Slice of Life': 'Повседневность',
  Mecha: 'Меха',
  Music: 'Музыка',
  Historical: 'История',
  Military: 'Военное',
  Shounen: 'Сёнен',
  Shoujo: 'Сёдзё',
  Seinen: 'Сэйнэн',
  Josei: 'Дзёсэй',
  'Martial Arts': 'Боевые искусства',
  Ecchi: 'Этти',
  'High Stakes Game': 'Игра на выживание',
  Racing: 'Гонки',
  Space: 'Космос',
  'Video Game': 'Видеоигры',
  'Adult Cast': 'Взрослые персонажи',
  Parody: 'Пародия',
  Gourmet: 'Гурман',
  Mythology: 'Мифология',
  Iyashikei: 'Исцеляющие истории',
  Workplace: 'Работа',
  Strategy: 'Стратегия',
});

const SEARCH_ALIASES = Object.freeze({
  'атакатитанов': 'Attack on Titan',
  'атака титанов': 'Attack on Titan',
  'стальнойалхимик': 'Fullmetal Alchemist Brotherhood',
  'стальной алхимик': 'Fullmetal Alchemist Brotherhood',
  'тетрадьсмерти': 'Death Note',
  'тетрадь смерти': 'Death Note',
  'вратaштейна': 'Steins Gate',
  'врата штейна': 'Steins Gate',
  'магическаябитва': 'Jujutsu Kaisen',
  'магическая битва': 'Jujutsu Kaisen',
  'клинокрассекающийдемонов': 'Demon Slayer',
  'клинок рассекающий демонов': 'Demon Slayer',
  'ванпис': 'One Piece',
  'ван пис': 'One Piece',
  'ванпанчмен': 'One Punch Man',
  'семьяшпиона': 'Spy x Family',
  'семья шпиона': 'Spy x Family',
  'ковбойбибоп': 'Cowboy Bebop',
  'ковбой бибоп': 'Cowboy Bebop',
  'наруто': 'Naruto',
  'охотникхоxотник': 'Hunter x Hunter 2011',
  'охотник х охотник': 'Hunter x Hunter 2011',
  'фрирен': 'Frieren Beyond Journey End',
});

export function localizeAnime(anime) {
  if (!anime) {
    return anime;
  }

  return {
    ...anime,
    titleRussian: anime.titleRussian || TITLE_MAP[anime.id] || anime.title || 'Без названия',
    genres: (anime.genres || []).map((genre) => GENRE_MAP[genre] || genre),
  };
}

export function resolveSearchQuery(query) {
  const normalized = normalizeKey(query);
  return SEARCH_ALIASES[normalized] || query;
}

export function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function matchesAnimeTitle(anime, query) {
  const normalizedQuery = normalizeKey(query);
  if (!normalizedQuery) {
    return false;
  }

  const candidates = [
    anime?.titleRussian,
    anime?.title,
    ...(anime?.synonyms || []),
  ].filter(Boolean);

  return candidates.some((candidate) => normalizeKey(candidate).includes(normalizedQuery));
}

export const matchesRussianTitle = matchesAnimeTitle;

export { TITLE_MAP, GENRE_MAP };
