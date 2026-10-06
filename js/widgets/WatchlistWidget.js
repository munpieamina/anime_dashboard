import { ListWidget, getCollection, updateRecord } from './ListWidget.js';

export class WatchlistWidget extends ListWidget {
  static meta = { title: 'Хочу посмотреть' };

  items() {
    return getCollection(this.ctx, (record) => record.status === 'plan');
  }

  emptyText() {
    return 'Список пока пуст.';
  }

  actions(record) {
    return [
      [
        'Начать просмотр',
        () => updateRecord(this, record, { status: 'watching' }, 'Приятного просмотра.'),
      ],
      [
        'Добавить в любимое',
        () => updateRecord(this, record, { favorite: true }, 'Добавлено в любимое.'),
      ],
      [
        'Убрать',
        () => updateRecord(this, record, { status: null }),
      ],
    ];
  }
}
