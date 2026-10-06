import { ListWidget, getCollection, updateRecord } from './ListWidget.js';

export class FavoriteWidget extends ListWidget {
  static meta = { title: 'Любимое' };

  items() {
    return getCollection(this.ctx, (record) => record.favorite);
  }

  emptyText() {
    return 'Здесь пока ничего нет. Добавьте аниме в любимое.';
  }

  actions(record) {
    return [
      [
        'Убрать из любимого',
        () => updateRecord(this, record, { favorite: false }, 'Убрано из любимого.'),
      ],
    ];
  }
}
