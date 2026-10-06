import { h } from '../utils.js';

export class AddWidgetMenu {
  constructor(root, dashboard, registry) {
    this.root = root;
    this.dashboard = dashboard;
    this.button = h(
      'button',
      {
        class: 'btn primary',
        type: 'button',
        'aria-haspopup': 'true',
        'aria-expanded': 'false',
      },
      'Добавить виджет',
    );
    this.list = h(
      'ul',
      { class: 'menu card', hidden: true },
      Object.entries(registry).map(([type, WidgetClass]) =>
        h(
          'li',
          {},
          h(
            'button',
            {
              class: 'mi',
              type: 'button',
              onclick: () => {
                dashboard.addWidget(type);
                this.setOpen(false);
                this.button.focus();
              },
            },
            WidgetClass.meta.title,
          ),
        ),
      ),
    );

    root.append(this.button, this.list);

    this.button.addEventListener('click', () => this.setOpen(this.list.hidden));

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) {
        this.setOpen(false);
      }
    });

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.setOpen(false);
        this.button.focus();
      }
    });
  }

  setOpen(open) {
    this.list.hidden = !open;
    this.button.setAttribute('aria-expanded', String(open));
  }
}
