import { h } from '../utils.js';

export class Modal {
  constructor(dialog) {
    this.dialog = dialog;
    this.onClose = null;
    this.previousFocus = null;

    dialog.addEventListener('close', () => {
      this.onClose?.();
      this.onClose = null;
      this.previousFocus?.focus?.();
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }

  open(label, content, onClose) {
    if (!this.dialog.open) {
      this.previousFocus = document.activeElement;
    }

    this.onClose = onClose;
    this.dialog.setAttribute('aria-label', label);
    this.dialog.replaceChildren(
      h(
        'button',
        {
          class: 'ib close-button',
          type: 'button',
          'aria-label': 'Закрыть',
          title: 'Закрыть',
          onclick: () => this.close(),
        },
        h('span', { class: 'icon', 'aria-hidden': 'true' }, '×'),
      ),
      content,
    );

    if (!this.dialog.open) {
      this.dialog.showModal();
    }
  }

  close() {
    if (this.dialog.open) {
      this.dialog.close();
    }
  }
}
