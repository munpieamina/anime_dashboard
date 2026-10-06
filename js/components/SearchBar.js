import { animeCard, empty, h } from '../utils.js';

export class SearchBar {
  constructor(root, ctx) {
    this.ctx = ctx;
    this.root = root;
    this.input = h('input', {
      id: 'anime-search',
      type: 'search',
      placeholder: 'Найти аниме...',
      autocomplete: 'off',
      enterkeyhint: 'search',
    });
    this.output = h('div', {
      class: 'results card',
      hidden: true,
      'aria-live': 'polite',
    });
    this.timer = null;
    this.controller = null;

    root.append(
      h(
        'form',
        {
          class: 'searchbar',
          role: 'search',
          onsubmit: (event) => {
            event.preventDefault();
            this.runSearch(this.input.value.trim());
          },
        },
        h('label', { for: this.input.id, class: 'sr' }, 'Найти аниме'),
        this.input,
      ),
      this.output,
    );

    this.input.addEventListener('input', () => {
      clearTimeout(this.timer);
      const query = this.input.value.trim();

      if (!query) {
        this.controller?.abort();
        this.show('idle');
        return;
      }

      this.timer = setTimeout(() => this.runSearch(query), 350);
    });

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.input.value = '';
        this.controller?.abort();
        this.show('idle');
      }
    });
  }

  async runSearch(query) {
    if (!query) {
      this.show('idle');
      return;
    }

    this.controller?.abort();
    this.controller = new AbortController();
    this.show('loading');

    try {
      const results = await this.ctx.catalog.search(query, this.controller.signal);

      if (this.controller.signal.aborted) {
        return;
      }

      this.show(results.length ? 'success' : 'empty', results);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.show('error');
      }
    }
  }

  show(state, list = []) {
    this.output.hidden = state === 'idle';

    switch (state) {
      case 'loading':
        this.output.replaceChildren(empty('Ищем аниме...'));
        break;
      case 'empty':
        this.output.replaceChildren(empty('Ничего не найдено. Попробуйте другое название.'));
        break;
      case 'error':
        this.output.replaceChildren(
          empty('Сейчас сервис поиска недоступен. Для популярных тайтлов можно попробовать русское название ещё раз.'),
        );
        break;
      case 'success':
        this.output.replaceChildren(
          h('div', { class: 'list' }, list.map((anime) => animeCard(anime, this.ctx))),
        );
        break;
      default:
        this.output.replaceChildren();
    }
  }
}
