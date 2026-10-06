import { UIComponent } from '../UIComponent.js';
import { h, empty, getDisplayTitle } from '../utils.js';
import { getCollection } from './ListWidget.js';

export class RatingsWidget extends UIComponent {
  static meta = { title: 'Мои оценки' };

  constructor(options) {
    super(options);
    this.sort = 'rating';
  }

  renderBody() {
    const items = getCollection(this.ctx, (record) => record.rating);

    if (!items.length) {
      this.body.replaceChildren(empty('Оценённых аниме пока нет.'));
      return;
    }

    const comparators = {
      rating: (a, b) => b.rating - a.rating,
      title: (a, b) => getDisplayTitle(a.anime).localeCompare(getDisplayTitle(b.anime), 'ru'),
      recent: (a, b) => (b.ratedAt || '').localeCompare(a.ratedAt || ''),
    };

    const select = h(
      'select',
      { id: `sort-${this.id}` },
      [
        ['rating', 'По оценке'],
        ['title', 'По названию'],
        ['recent', 'Недавние'],
      ].map(([value, label]) => h('option', { value, selected: value === this.sort }, label)),
    );

    select.addEventListener('change', () => {
      this.sort = select.value;
      this.refresh();
    });

    const sorted = [...items].sort(comparators[this.sort]);

    this.body.replaceChildren(
      h('label', { class: 'sm muted', for: select.id }, 'Сортировка'),
      select,
      h(
        'ul',
        { class: 'rlist' },
        sorted.map((record) =>
          h(
            'li',
            {},
            h(
              'button',
              {
                class: 'atitle',
                type: 'button',
                onclick: () => this.ctx.openDetails(record.anime),
              },
              getDisplayTitle(record.anime),
            ),
            h('b', {}, `${record.rating}/10`),
          ),
        ),
      ),
    );
  }
}
