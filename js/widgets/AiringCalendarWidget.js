import { UIComponent } from '../UIComponent.js';
import { countdown, empty, h, getDisplayTitle } from '../utils.js';
import { getCollection } from './ListWidget.js';

export class AiringCalendarWidget extends UIComponent {
  static meta = { title: 'Выход новых эпизодов' };

  constructor(options) {
    super(options);
    this.cache = new Map();
  }

  mount(parent) {
    super.mount(parent);
    this.setRepeat(() => this.renderBody(), 60000);
  }

  refresh() {
    const watching = getCollection(this.ctx, (record) => record.status === 'watching')
      .filter((record) => !this.cache.has(record.anime.id));

    if (watching.length) {
      this.#load(watching);
    }

    super.refresh();
  }

  async #load(records) {
    records.forEach((record) => this.cache.set(record.anime.id, 'pending'));

    const results = await this.request((signal) =>
      Promise.allSettled(
        records.map((record) => this.ctx.anilist.getAiringSchedule(record.anime.id, signal)),
      ),
    );

    if (!results) {
      records.forEach((record) => {
        if (this.cache.get(record.anime.id) === 'pending') {
          this.cache.delete(record.anime.id);
        }
      });
      return;
    }

    results.forEach((result, index) => {
      this.cache.set(records[index].anime.id, result.status === 'fulfilled' ? { episode: result.value } : { error: true });
    });

    this.refresh();
  }

  renderBody() {
    const watching = getCollection(this.ctx, (record) => record.status === 'watching');

    if (!watching.length) {
      this.body.replaceChildren(empty('Добавьте аниме в «Смотрю», чтобы видеть расписание.'));
      return;
    }

    const getCache = (record) => this.cache.get(record.anime.id);
    const allFailed = watching.every((record) => getCache(record)?.error);

    if (allFailed) {
      this.body.replaceChildren(empty('Не удалось загрузить расписание. Проверьте соединение и попробуйте ещё раз.'));
      return;
    }

    const airingAt = (record) => getCache(record)?.episode?.airingAt || Number.POSITIVE_INFINITY;
    const sorted = [...watching].sort((a, b) => airingAt(a) - airingAt(b));

    this.body.replaceChildren(
      ...sorted.map((record) => {
        const cache = getCache(record);
        const episode = cache?.episode;
        const title = getDisplayTitle(record.anime);

        return h(
          'div',
          { class: 'arow' },
          h(
            'button',
            {
              class: 'atitle',
              type: 'button',
              onclick: () => this.ctx.openDetails(record.anime),
            },
            title,
          ),
          !cache || cache === 'pending'
            ? h('p', { class: 'muted' }, 'Загружаем...')
            : episode
              ? h(
                  'p',
                  {},
                  `Эпизод ${episode.episode}`,
                  h('br'),
                  new Date(episode.airingAt * 1000).toLocaleString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  ' · ',
                  h('b', {}, countdown(episode.airingAt)),
                )
              : h('p', { class: 'muted' }, 'Дата выхода пока неизвестна.'),
        );
      }),
      h('p', { class: 'muted sm' }, 'Время указано по вашему часовому поясу.'),
    );
  }
}
