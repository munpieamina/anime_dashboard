import { localizeAnime, matchesAnimeTitle, resolveSearchQuery } from '../Localization.js';
import { mergeAnimeData } from '../utils.js';

const LOCAL_FALLBACK = [
  { id: 1, title: 'Cowboy Bebop', titleRussian: 'Ковбой Бибоп', year: 1998, genres: ['Экшен', 'Научная фантастика'], episodes: 26 },
  { id: 20, title: 'Naruto', titleRussian: 'Наруто', year: 2002, genres: ['Экшен', 'Приключения', 'Фэнтези'], episodes: 220 },
  { id: 21, title: 'One Piece', titleRussian: 'Ван-Пис', year: 1999, genres: ['Экшен', 'Приключения', 'Фэнтези'], episodes: null },
  { id: 1535, title: 'Death Note', titleRussian: 'Тетрадь смерти', year: 2006, genres: ['Детектив', 'Сверхъестественное', 'Саспенс'], episodes: 37 },
  { id: 5114, title: 'Fullmetal Alchemist: Brotherhood', titleRussian: 'Стальной алхимик: Братство', year: 2009, genres: ['Экшен', 'Приключения', 'Драма', 'Фэнтези'], episodes: 64 },
  { id: 9253, title: 'Steins;Gate', titleRussian: 'Врата Штейна', year: 2011, genres: ['Драма', 'Научная фантастика', 'Саспенс'], episodes: 24 },
  { id: 11061, title: 'Hunter x Hunter (2011)', titleRussian: 'Охотник х Охотник (2011)', year: 2011, genres: ['Экшен', 'Приключения', 'Фэнтези'], episodes: 148 },
  { id: 16498, title: 'Attack on Titan', titleRussian: 'Атака титанов', year: 2013, genres: ['Экшен', 'Драма', 'Фэнтези'], episodes: 25 },
  { id: 30276, title: 'One Punch Man', titleRussian: 'Ванпанчмен', year: 2015, genres: ['Экшен', 'Комедия'], episodes: 12 },
  { id: 38000, title: 'Demon Slayer', titleRussian: 'Клинок, рассекающий демонов', year: 2019, genres: ['Экшен', 'Фэнтези'], episodes: 26 },
  { id: 40748, title: 'Jujutsu Kaisen', titleRussian: 'Магическая битва', year: 2020, genres: ['Экшен', 'Фэнтези'], episodes: 24 },
  { id: 50265, title: 'Spy x Family', titleRussian: 'Семья шпиона', year: 2022, genres: ['Экшен', 'Комедия'], episodes: 12 },
  { id: 52991, title: "Frieren: Beyond Journey's End", titleRussian: 'Фрирен, провожающая в последний путь', year: 2023, genres: ['Приключения', 'Драма', 'Фэнтези'], episodes: 28 },
  { id: 59978, title: "Frieren: Beyond Journey's End Season 2", titleRussian: 'Фрирен, провожающая в последний путь 2', year: 2026, genres: ['Приключения', 'Драма', 'Фэнтези'], episodes: 10 },
];

export class AnimeCatalogService {
  constructor({ jikan, anilist }) {
    this.jikan = jikan;
    this.anilist = anilist;
    this.cache = new Map();
  }

  async search(query, signal) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const cached = this.cache.get(normalizedQuery.toLowerCase());
    if (cached) {
      return cached;
    }

    const localResults = LOCAL_FALLBACK.filter((anime) => matchesAnimeTitle(anime, normalizedQuery));
    const remoteQuery = resolveSearchQuery(normalizedQuery);
    const errors = [];
    let remoteResults = [];

    try {
      remoteResults = await this.anilist.searchAnime(remoteQuery, signal);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      errors.push(error);
    }

    if (!remoteResults.length) {
      try {
        remoteResults = await this.jikan.searchAnime(remoteQuery, signal);
      } catch (error) {
        if (error.name === 'AbortError') {
          throw error;
        }
        errors.push(error);
      }
    }

    const merged = new Map();

    for (const anime of [...localResults, ...remoteResults]) {
      const localized = localizeAnime(anime);
      const previous = merged.get(localized.id);
      merged.set(localized.id, previous ? mergeAnimeData(previous, localized) : localized);
    }

    const results = [...merged.values()].slice(0, 8);

    if (!results.length && errors.length === 2) {
      throw errors[1];
    }

    this.cache.set(normalizedQuery.toLowerCase(), results);
    return results;
  }

  async getAnimeById(id, signal) {
    const cached = this.cache.get(`id:${id}`);
    if (cached) {
      return cached;
    }

    let anime = null;

    try {
      anime = await this.jikan.getAnimeDetails(id, signal);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
    }

    if (!anime) {
      anime = await this.anilist.getAnimeByMalId(id, signal);
    }

    if (!anime) {
      throw new Error(`Anime ${id} is unavailable`);
    }

    anime = localizeAnime(anime);
    this.cache.set(`id:${id}`, anime);
    return anime;
  }
}
