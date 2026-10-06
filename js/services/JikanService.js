import { localizeAnime } from '../Localization.js';

const BASE_URL = 'https://api.jikan.moe/v4';
const REQUEST_TIMEOUT = 10000;

export class JikanService {
  async #get(path, signal) {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT);
    const abort = () => timeoutController.abort();

    signal?.addEventListener('abort', abort, { once: true });

    try {
      const response = await fetch(BASE_URL + path, {
        signal: timeoutController.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const retryAfter = Number(response.headers.get('Retry-After')) || 0;
        const error = new Error(`Jikan HTTP ${response.status}`);
        error.status = response.status;
        error.retryAfter = retryAfter;
        throw error;
      }

      const json = await response.json();
      return json.data;
    } catch (error) {
      if (timeoutController.signal.aborted && !signal?.aborted) {
        const timeoutError = new Error('Jikan request timeout');
        timeoutError.status = 408;
        throw timeoutError;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  #normalize(data) {
    return localizeAnime({
      id: data.mal_id,
      title: data.title_english || data.title,
      titleRussian: null,
      year: data.year || data.aired?.prop?.from?.year || null,
      poster: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || null,
      genres: (data.genres || []).map((genre) => genre.name),
      episodes: data.episodes || null,
      status: data.status || null,
      score: data.score || null,
      synopsis: data.synopsis || '',
      duration: Number.parseInt(data.duration, 10) || null,
      synonyms: data.title_synonyms || [],
    });
  }

  async searchAnime(query, signal) {
    const data = await this.#get(
      `/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`,
      signal,
    );

    return data.map((anime) => this.#normalize(anime));
  }

  async getAnimeDetails(id, signal) {
    return this.#normalize(await this.#get(`/anime/${encodeURIComponent(id)}`, signal));
  }

  async getRandomAnime(signal) {
    return this.#normalize(await this.#get('/random/anime?sfw=true', signal));
  }
}
