import { localizeAnime } from './Localization.js';

const VERSION = 3;
const PREFIX = 'koi:';

export class StorageService {
  #bus;

  constructor(bus) {
    this.#bus = bus;
    this.#migrate();
  }

  #migrate() {
    const version = this.read('schemaVersion', 0);

    if (version < 1) {
      this.write('schemaVersion', 1);
    }

    if (version < 2) {
      this.write('schemaVersion', 2);
    }

    if (version < 3) {
      const collection = this.read('collection', {});
      const migrated = {};

      for (const [id, record] of Object.entries(collection)) {
        migrated[id] = {
          ...record,
          anime: localizeAnime(record.anime || {}),
        };
      }

      this.write('collection', migrated);
      this.write('schemaVersion', VERSION);
    }
  }

  read(key, defaultValue) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // localStorage can be disabled or unavailable in private mode.
    }
  }

  list() {
    return Object.values(this.read('collection', {}));
  }

  get(id) {
    return this.read('collection', {})[id];
  }

  update(anime, patch = {}) {
    const collection = this.read('collection', {});
    const now = new Date().toISOString();
    const current = collection[anime.id] || {
      anime: {},
      status: null,
      favorite: false,
      progress: 0,
      rating: null,
      review: null,
      addedAt: now,
      completedAt: null,
    };

    current.anime = {
      ...current.anime,
      ...Object.fromEntries(
        Object.entries(anime).filter(([, value]) => value !== null && value !== '' && value !== undefined),
      ),
    };

    const { reviewText, ...rest } = patch;
    Object.assign(current, rest);

    if (rest.rating !== undefined) {
      const rating = Math.round(Number(rest.rating));
      current.rating = rating >= 1 && rating <= 10 ? rating : null;
      current.ratedAt = now;
    }

    if (reviewText !== undefined) {
      const text = String(reviewText).trim().slice(0, 1000);
      current.review = text
        ? {
            text,
            createdAt: current.review?.createdAt || now,
            updatedAt: now,
          }
        : null;
    }

    const totalEpisodes = current.anime.episodes;

    if (rest.status === 'completed') {
      if (totalEpisodes) {
        current.progress = totalEpisodes;
      }
      current.completedAt = current.completedAt || now;
    } else if (rest.status !== undefined) {
      current.completedAt = null;
    }

    if (rest.status === 'watching' && totalEpisodes && current.progress >= totalEpisodes) {
      current.progress = 0;
    }

    current.progress = Math.max(
      0,
      Math.min(totalEpisodes || Number.POSITIVE_INFINITY, Math.floor(Number(current.progress) || 0)),
    );

    let autoCompleted = false;

    if (current.status === 'watching' && totalEpisodes && current.progress >= totalEpisodes) {
      current.status = 'completed';
      current.completedAt = now;
      autoCompleted = true;
    }

    collection[anime.id] = current;
    this.write('collection', collection);
    this.#bus.emit('change', { id: anime.id });

    if (autoCompleted) {
      this.#bus.emit('completed', current);
    }

    return current;
  }

  clear() {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage cleanup errors.
    }

    this.write('schemaVersion', VERSION);
    this.#bus.emit('reset');
  }
}
