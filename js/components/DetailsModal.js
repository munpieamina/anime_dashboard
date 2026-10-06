import { h, keepFocus, safeUrl, getDisplayTitle, STATUS } from '../utils.js';

export class DetailsModal {
  constructor(modal, ctx) {
    this.modal = modal;
    this.ctx = ctx;
    this.controller = null;
    this.unsubscribe = null;
    this.anime = null;
    this.reviewDraft = null;
    this.loadFailed = false;
    this.container = null;
  }

  open(anime) {
    this.controller?.abort();
    this.unsubscribe?.();

    this.anime = { ...anime };
    this.reviewDraft = null;
    this.loadFailed = false;
    this.container = h('div', { class: 'details' });
    this.controller = new AbortController();

    this.unsubscribe = this.ctx.bus.on('change', ({ id }) => {
      if (id === this.anime.id && this.modal.dialog.open) {
        this.render();
      }
    });

    this.modal.open(this.anime.titleRussian || this.anime.title, this.container, () => {
      this.controller?.abort();
      this.unsubscribe?.();
    });

    this.render();
    this.#loadDetails(this.controller.signal);
  }

  async #loadDetails(signal) {
    try {
      const freshAnime = await this.ctx.catalog.getAnimeById(this.anime.id, signal);
      this.anime = { ...this.anime, ...freshAnime };
      this.ctx.store.update(this.anime, {});
      this.render();
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.loadFailed = true;
        this.render();
      }
    }
  }

  render() {
    if (!this.container) {
      return;
    }

    keepFocus(this.container, () => {
      const record = this.ctx.store.get(this.anime.id) || {};
      const poster = safeUrl(this.anime.poster);
      const title = getDisplayTitle(this.anime);
      const statusButton = (status) =>
        h(
          'button',
          {
            class: 'btn sm',
            type: 'button',
            'aria-pressed': String(record.status === status),
            onclick: () => {
              const sameStatus = record.status === status;
              this.ctx.store.update(this.anime, { status: sameStatus ? null : status });
              if (!sameStatus) {
                this.ctx.toast(STATUS[status]);
              }
            },
          },
          STATUS[status],
        );

      const reviewInput = h('textarea', {
        id: 'review-text',
        rows: 4,
        maxlength: 1000,
        placeholder: 'Напишите личную рецензию...',
      });
      reviewInput.value = this.reviewDraft ?? record.review?.text ?? '';
      reviewInput.addEventListener('input', () => {
        this.reviewDraft = reviewInput.value;
      });

      this.container.replaceChildren(
        poster
          ? h('img', {
              class: 'dposter',
              src: poster,
              alt: `Постер: ${title}`,
            })
          : h('div', {
              class: 'dposter ph',
              role: 'img',
              'aria-label': `Постер для «${title}» пока недоступен`,
            }),
        h(
          'div',
          { class: 'dmain' },
          h('h2', {}, title),
          h(
            'p',
            { class: 'muted' },
            [
              this.anime.year,
              (this.anime.genres || []).join(', '),
              this.anime.episodes ? `${this.anime.episodes} эп.` : 'эпизоды неизвестны',
              this.anime.score ? `MAL ${this.anime.score}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          ),
          h(
            'p',
            { class: 'syn' },
            this.anime.synopsis ||
              (this.loadFailed
                ? 'Не удалось получить описание. Попробуйте открыть карточку ещё раз.'
                : 'Загружаем описание...'),
          ),
          h(
            'div',
            { class: 'row' },
            h(
              'button',
              {
                class: 'btn sm',
                type: 'button',
                'aria-pressed': String(Boolean(record.favorite)),
                onclick: () => {
                  this.ctx.store.update(this.anime, { favorite: !record.favorite });
                  this.ctx.toast(record.favorite ? 'Убрано из любимого.' : 'Добавлено в любимое.');
                },
              },
              'Любимое',
            ),
            statusButton('watching'),
            statusButton('plan'),
            statusButton('completed'),
            statusButton('dropped'),
          ),
          record.status === 'watching'
            ? h(
                'p',
                { class: 'muted' },
                `Прогресс: ${record.progress} / ${this.anime.episodes || '?'}`,
              )
            : null,
          h(
            'fieldset',
            { class: 'rate' },
            h('legend', {}, 'Оценка'),
            Array.from({ length: 10 }, (_, index) => index + 1).map((rating) =>
              h(
                'button',
                {
                  class: 'rt',
                  type: 'button',
                  'aria-pressed': String(record.rating === rating),
                  'aria-label': `Оценка ${rating}`,
                  onclick: () => {
                    this.ctx.store.update(this.anime, {
                      rating: record.rating === rating ? null : rating,
                    });
                    this.ctx.toast('Оценка сохранена.');
                  },
                },
                String(rating),
              ),
            ),
          ),
          h('label', { for: reviewInput.id }, 'Личная рецензия'),
          reviewInput,
          h(
            'div',
            { class: 'row' },
            h(
              'button',
              {
                class: 'btn primary sm',
                type: 'button',
                onclick: () => {
                  const text = reviewInput.value.trim();

                  if (!text) {
                    this.ctx.toast('Рецензия пуста.');
                    return;
                  }

                  this.reviewDraft = null;
                  this.ctx.store.update(this.anime, { reviewText: text });
                  this.ctx.toast(record.review ? 'Рецензия обновлена.' : 'Рецензия сохранена.');
                },
              },
              'Сохранить',
            ),
            record.review
              ? h(
                  'button',
                  {
                    class: 'btn sm',
                    type: 'button',
                    onclick: () => {
                      this.reviewDraft = null;
                      this.ctx.store.update(this.anime, { reviewText: '' });
                      this.ctx.toast('Рецензия удалена.');
                    },
                  },
                  'Удалить',
                )
              : null,
          ),
        ),
      );
    });
  }
}
