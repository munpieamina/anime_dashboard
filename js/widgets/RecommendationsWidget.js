import { UIComponent } from '../UIComponent.js';
import { animeCard, empty, h } from '../utils.js';
import { getCollection, updateRecord } from './ListWidget.js';

export class RecommendationsWidget extends UIComponent {
  static meta = { title: 'Рекомендации' };

  constructor(options) {
    super(options);
    this.data = null;
    this.seedKey = '';
    this.hasError = false;
  }

  #getSeeds() {
    return getCollection(this.ctx, (record) => record.favorite || record.rating >= 8).slice(0, 4);
  }

  refresh() {
    const seeds = this.#getSeeds();
    const key = seeds.map((record) => record.anime.id).join(',');

    if (key !== this.seedKey) {
      this.seedKey = key;
      this.data = null;
      this.hasError = false;

      if (seeds.length) {
        this.#load(seeds);
      }
    }

    super.refresh();
  }

  async #load(seeds) {
    const results = await this.request((signal) =>
      Promise.allSettled(
        seeds.map((record) => this.ctx.anilist.getRecommendations(record.anime.id, signal)),
      ),
    );

    if (!results) {
      return;
    }

    this.hasError = results.every((result) => result.status === 'rejected');

    const seedGenres = new Set(seeds.flatMap((record) => record.anime.genres || []));
    const recommendations = new Map();

    results.forEach((result, seedIndex) => {
      if (result.status !== 'fulfilled') {
        return;
      }

      for (const anime of result.value) {
        const item = recommendations.get(anime.id) || { anime, from: [] };
        item.from.push(seeds[seedIndex].anime.titleRussian || seeds[seedIndex].anime.title);
        recommendations.set(anime.id, item);
      }
    });

    this.data = [...recommendations.values()]
      .map((item) => {
        const sharedGenres = (item.anime.genres || []).filter((genre) => seedGenres.has(genre));
        return {
          ...item,
          sharedGenres,
          score: sharedGenres.length + item.from.length * 2,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);

    this.refresh();
  }

  renderBody() {
    const seeds = this.#getSeeds();

    if (!seeds.length) {
      this.body.replaceChildren(empty('Добавьте несколько любимых или оценённых аниме, чтобы получить рекомендации.'));
      return;
    }

    if (this.data === null) {
      this.body.replaceChildren(empty('Загружаем рекомендации...'));
      return;
    }

    if (this.hasError) {
      this.body.replaceChildren(empty('Не удалось загрузить рекомендации. Проверьте соединение и попробуйте ещё раз.'));
      return;
    }

    const list = this.data.filter((item) => !this.ctx.store.get(item.anime.id)).slice(0, 6);

    if (!list.length) {
      this.body.replaceChildren(empty('Пока нечего порекомендовать.'));
      return;
    }

    this.body.replaceChildren(
      h('p', { class: 'muted' }, 'Похожие на ваши любимые аниме:'),
      h(
        'div',
        { class: 'list' },
        list.map((item) => {
          const card = animeCard(item.anime, this.ctx, [
            [
              'Хочу посмотреть',
              () => updateRecord(this, { anime: item.anime }, { status: 'plan' }, 'Добавлено в список.'),
            ],
          ]);

          card.querySelector('.ainfo')?.append(
            h(
              'p',
              { class: 'why' },
              `${item.sharedGenres.length ? `Похожие жанры: ${item.sharedGenres.join(', ')}. ` : ''}Связано с: ${item.from.join(', ')}.`,
            ),
          );

          return card;
        }),
      ),
    );
  }
}
