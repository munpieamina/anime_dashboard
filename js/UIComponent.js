import { h, keepFocus } from './utils.js';

export class UIComponent {
  #listeners = [];
  #timers = new Set();
  #subscriptions = [];
  #controller = null;

  constructor({ id, type, ctx, minimized = false }) {
    const meta = this.constructor.meta;

    if (!meta?.title) {
      throw new Error(`Widget ${type} has no title metadata`);
    }

    Object.assign(this, {
      id,
      type,
      ctx,
      title: meta.title,
    });

    this.isMinimized = minimized;
    this.element = null;
    this.body = null;
    this.minimizeButton = null;
  }

  request(task) {
    this.abortRequests();
    const controller = new AbortController();
    this.#controller = controller;

    return task(controller.signal)
      .catch((error) => {
        if (error.name === 'AbortError') {
          return undefined;
        }
        throw error;
      });
  }

  abortRequests() {
    this.#controller?.abort();
    this.#controller = null;
  }

  addEventListenerWithCleanup(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    this.#listeners.push(() => target.removeEventListener(eventName, handler, options));
  }

  setTimer(callback, delay) {
    const timer = setTimeout(callback, delay);
    this.#timers.add(timer);
    return timer;
  }

  setRepeat(callback, delay) {
    const timer = setInterval(callback, delay);
    this.#timers.add(timer);
    return timer;
  }

  subscribe(eventName, handler) {
    this.#subscriptions.push(this.ctx.bus.on(eventName, handler));
  }

  #dispatch(name, detail = {}) {
    this.element?.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        detail: { id: this.id, ...detail },
      }),
    );
  }

  render() {
    const icons = Object.freeze({
      up: '↑',
      down: '↓',
      remove: '×',
    });

    const actionButton = (action, label) => {
      const button = h(
        'button',
        {
          class: 'ib',
          type: 'button',
          'aria-label': label,
          title: label,
        },
        h('span', { class: 'icon', 'aria-hidden': 'true' }, icons[action] ?? ''),
      );

      this.addEventListenerWithCleanup(button, 'click', (event) => {
        this.#dispatch('widget:action', {
          action,
          button: event.currentTarget,
        });
      });

      return button;
    };

    const handle = h('span', {
      class: 'handle',
      title: 'Перетащить виджет',
      'aria-label': 'Перетащить виджет',
      role: 'img',
    }, h('span', { class: 'icon', 'aria-hidden': 'true' }, '⠿'));

    this.addEventListenerWithCleanup(handle, 'pointerdown', () => {
      this.element.draggable = true;
    });

    this.minimizeButton = h(
      'button',
      {
        class: 'ib',
        type: 'button',
        'aria-label': 'Свернуть',
        'aria-expanded': 'true',
        title: 'Свернуть',
      },
      h('span', { class: 'icon', 'aria-hidden': 'true' }, '⌄'),
    );

    this.addEventListenerWithCleanup(this.minimizeButton, 'click', () => {
      this.isMinimized ? this.restore() : this.minimize();
    });

    this.body = h('div', { class: 'wbody' });
    this.element = h(
      'article',
      {
        class: `card widget w-${this.type}`,
        'data-id': this.id,
        'aria-labelledby': `title-${this.id}`,
      },
      h(
        'header',
        { class: 'whead' },
        handle,
        h('h2', { id: `title-${this.id}` }, this.title),
        h(
          'div',
          { class: 'wctl' },
          actionButton('up', 'Выше'),
          actionButton('down', 'Ниже'),
          this.minimizeButton,
          actionButton('remove', 'Удалить виджет'),
        ),
      ),
      this.body,
    );

    this.#applyMinimizedState();
    return this.element;
  }

  #applyMinimizedState() {
    if (!this.body || !this.element || !this.minimizeButton) {
      return;
    }

    this.body.hidden = this.isMinimized;
    this.element.classList.toggle('min', this.isMinimized);
    const label = this.isMinimized ? 'Развернуть' : 'Свернуть';
    this.minimizeButton.replaceChildren(
      h('span', { class: 'icon', 'aria-hidden': 'true' }, '⌄'),
    );
    this.minimizeButton.setAttribute('aria-expanded', String(!this.isMinimized));
    this.minimizeButton.setAttribute('aria-label', label);
    this.minimizeButton.setAttribute('title', label);
  }

  minimize() {
    this.isMinimized = true;
    this.#applyMinimizedState();
    this.#dispatch('widget:state');
  }

  restore() {
    this.isMinimized = false;
    this.#applyMinimizedState();
    this.#dispatch('widget:state');
  }

  mount(parent) {
    if (!this.element) {
      this.render();
    }

    parent.append(this.element);
    this.subscribe('change', ({ id }) => {
      if (id === undefined || id === this.id || this.shouldRefreshOnChange?.(id)) {
        this.refresh();
      }
    });
    this.refresh();
  }

  renderBody() {
    // Implemented by subclasses.
  }

  refresh() {
    if (this.body) {
      keepFocus(this.body, () => this.renderBody());
    }
  }

  destroy() {
    this.abortRequests();
    this.#listeners.forEach((cleanup) => cleanup());
    this.#listeners = [];

    this.#timers.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.#timers.clear();

    this.#subscriptions.forEach((unsubscribe) => unsubscribe());
    this.#subscriptions = [];

    this.element?.remove();
    this.element = null;
    this.body = null;
  }
}
