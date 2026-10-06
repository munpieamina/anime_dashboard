import { h } from './utils.js';

export class Dashboard {
  #widgets = new Map();
  #draggedId = null;

  constructor(root, ctx, registry) {
    this.root = root;
    this.ctx = ctx;
    this.registry = registry;
    this.emptyElement = this.#createEmptyState();

    this.#bindWidgetActions();
    this.#bindDragAndDrop();
  }

  #createEmptyState() {
    return h(
      'div',
      { class: 'empty-dash' },
      h('p', { class: 'big' }, 'Ваш dashboard пуст.'),
      h('p', { class: 'muted' }, 'Добавьте виджеты, которые хотите видеть здесь.'),
      h(
        'button',
        {
          class: 'btn primary',
          type: 'button',
          onclick: () => document.querySelector('#addMenu .primary')?.click(),
        },
        'Добавить виджет',
      ),
    );
  }

  #bindWidgetActions() {
    this.root.addEventListener('widget:action', (event) => {
      const { id, action, button } = event.detail;

      if (action === 'remove') {
        this.removeWidget(id);
        return;
      }

      this.moveWidget(id, action === 'up' ? -1 : 1);
      button?.isConnected && button.focus();
    });

    this.root.addEventListener('widget:state', () => this.saveLayout());
  }

  #bindDragAndDrop() {
    this.root.addEventListener('dragstart', (event) => {
      this.#draggedId = event.target.closest?.('.widget')?.dataset.id || null;
      event.dataTransfer?.setData('text/plain', this.#draggedId || '');
    });

    this.root.addEventListener('dragover', (event) => {
      if (this.#draggedId) {
        event.preventDefault();
      }
    });

    this.root.addEventListener('drop', (event) => {
      event.preventDefault();

      const targetId = event.target.closest?.('.widget')?.dataset.id;

      if (!this.#draggedId || !targetId || this.#draggedId === targetId) {
        return;
      }

      const entries = [...this.#widgets.entries()];
      const fromIndex = entries.findIndex(([id]) => id === this.#draggedId);
      const toIndex = entries.findIndex(([id]) => id === targetId);

      if (fromIndex < 0 || toIndex < 0) {
        return;
      }

      const [item] = entries.splice(fromIndex, 1);
      entries.splice(toIndex, 0, item);
      this.#widgets = new Map(entries);
      this.render();
      this.saveLayout();
    });

    this.root.addEventListener('dragend', () => {
      this.#draggedId = null;
      this.root.querySelectorAll('.widget').forEach((widget) => {
        widget.draggable = false;
      });
    });
  }

  hasWidget(type) {
    return [...this.#widgets.values()].some((widget) => widget.type === type);
  }

  getWidget(id) {
    return this.#widgets.get(id);
  }

  addWidget(type, { minimized = false, save = true } = {}) {
    const WidgetClass = this.registry[type];

    if (!WidgetClass) {
      return null;
    }

    if (this.hasWidget(type)) {
      this.ctx.toast('Этот виджет уже добавлен.');
      return null;
    }

    const widget = new WidgetClass({
      id: `${type}-${Date.now().toString(36)}`,
      type,
      ctx: this.ctx,
      minimized,
    });

    this.#widgets.set(widget.id, widget);
    widget.mount(this.root);
    this.render();

    if (save) {
      this.saveLayout();
      this.ctx.toast('Виджет добавлен.');
    }

    return widget;
  }

  removeWidget(id) {
    const widget = this.#widgets.get(id);

    if (!widget) {
      return;
    }

    widget.destroy();
    this.#widgets.delete(id);
    this.render();
    this.saveLayout();
  }

  moveWidget(id, direction) {
    const entries = [...this.#widgets.entries()];
    const index = entries.findIndex(([widgetId]) => widgetId === id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= entries.length) {
      return;
    }

    [entries[index], entries[nextIndex]] = [entries[nextIndex], entries[index]];
    this.#widgets = new Map(entries);
    this.render();
    this.saveLayout();
  }

  render() {
    const elements = [...this.#widgets.values()].map((widget) => widget.element);
    this.root.replaceChildren(...(elements.length ? elements : [this.emptyElement]));
  }

  saveLayout() {
    const layout = [...this.#widgets.values()].map((widget) => ({
      type: widget.type,
      min: widget.isMinimized,
    }));

    this.ctx.store.write('layout', layout);
  }

  loadLayout() {
    const layout = this.ctx.store.read('layout', []);

    for (const item of layout) {
      this.addWidget(item.type, {
        minimized: Boolean(item.min),
        save: false,
      });
    }

    this.render();
  }

  destroyAll() {
    this.#widgets.forEach((widget) => widget.destroy());
    this.#widgets.clear();
    this.render();
  }
}
