import { localizeAnime } from '../Localization.js';

const ENDPOINT = 'https://graphql.anilist.co';
const REQUEST_TIMEOUT = 10000;

export class AniListService {
  async #query(query, variables, signal) {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT);
    const abort = () => timeoutController.abort();

    signal?.addEventListener('abort', abort, { once: true });

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        signal: timeoutController.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const error = new Error(`AniList HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const json = await response.json();

      if (json.errors?.length) {
        throw new Error('AniList GraphQL error');
      }

      return json.data;
    } catch (error) {
      if (timeoutController.signal.aborted && !signal?.aborted) {
        const timeoutError = new Error('AniList request timeout');
        timeoutError.status = 408;
        throw timeoutError;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  #normalizeMedia(media) {
    return localizeAnime({
      id: media.idMal,
      title: media.title?.english || media.title?.romaji || media.title?.native,
      titleRussian: null,
      year: media.seasonYear || null,
      poster: media.coverImage?.extraLarge || media.coverImage?.large || null,
      genres: media.genres || [],
      episodes: media.episodes || null,
      duration: media.duration || null,
      score: media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : null,
    });
  }

  async searchAnime(query, signal) {
    const data = await this.#query(
      `query SearchAnime($search: String) {
        Page(perPage: 8) {
          media(search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
            idMal
            title { romaji english native }
            coverImage { large extraLarge }
            seasonYear
            episodes
            duration
            averageScore
            genres
          }
        }
      }`,
      { search: query },
      signal,
    );

    return (data.Page?.media || []).filter((anime) => anime.idMal).map((anime) => this.#normalizeMedia(anime));
  }

  async getAnimeByMalId(malId, signal) {
    const data = await this.#query(
      `query AnimeByMalId($malId: Int) {
        Media(idMal: $malId, type: ANIME) {
          idMal
          title { romaji english native }
          coverImage { large extraLarge }
          seasonYear
          episodes
          duration
          averageScore
          genres
        }
      }`,
      { malId },
      signal,
    );

    return data.Media?.idMal ? this.#normalizeMedia(data.Media) : null;
  }

  async getRecommendations(malId, signal) {
    const data = await this.#query(
      `query Recommendations($id: Int) {
        Media(idMal: $id, type: ANIME) {
          recommendations(perPage: 10, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                idMal
                title { romaji english native }
                coverImage { large extraLarge }
                seasonYear
                episodes
                duration
                averageScore
                genres
              }
            }
          }
        }
      }`,
      { id: malId },
      signal,
    );

    return (data.Media?.recommendations?.nodes || [])
      .map((node) => node.mediaRecommendation)
      .filter((media) => media?.idMal)
      .map((media) => this.#normalizeMedia(media));
  }

  async getAiringSchedule(malId, signal) {
    const data = await this.#query(
      `query Airing($id: Int) {
        Media(idMal: $id, type: ANIME) {
          nextAiringEpisode { episode airingAt }
        }
      }`,
      { id: malId },
      signal,
    );

    return data.Media?.nextAiringEpisode || null;
  }
}
