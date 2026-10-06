import { h, formatDate } from '../utils.js';
import { ListWidget, getCollection } from './ListWidget.js';

export class CompletedWidget extends ListWidget {
  static meta = { title: 'Просмотрено' };

  items() {
    return getCollection(this.ctx, (record) => record.status === 'completed').sort((a, b) =>
      (b.completedAt || '').localeCompare(a.completedAt || ''),
    );
  }

  emptyText() {
    return 'Завершённые аниме появятся здесь.';
  }

  extra(record) {
    return h(
      'div',
      {},
      record.completedAt
        ? h('p', { class: 'muted sm' }, `Завершено: ${formatDate(record.completedAt)}`)
        : null,
      record.review ? h('p', { class: 'rev' }, record.review.text) : null,
    );
  }
}
