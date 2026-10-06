import { UIComponent } from '../UIComponent.js';
import { animeCard, empty, h } from '../utils.js';

export class ListWidget extends UIComponent {
  items() {
    return [];
  }

  emptyText() {
    return '';
  }

  actions() {
    return [];
  }

  extra() {
    return null;
  }

  renderBody() {
    const items = this.items();

    if (!items.length) {
      this.body.replaceChildren(empty(this.emptyText()));
      return;
    }

    const list = items.map((record) => {
      const card = animeCard(record.anime, this.ctx, this.actions(record));
      const extra = this.extra(record);

      if (extra) {
        card.querySelector('.ainfo')?.append(extra);
      }

      return card;
    });

    this.body.replaceChildren(h('div', { class: 'list' }, list));
  }
}

export function getCollection(ctx, filter) {
  return ctx.store.list().filter(filter);
}

export function updateRecord(widget, record, patch, message = '') {
  widget.ctx.store.update(record.anime, patch);

  if (message) {
    widget.ctx.toast(message);
  }
}
