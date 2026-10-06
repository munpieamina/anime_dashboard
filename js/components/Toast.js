import { h } from '../utils.js';

export class Toast {
  constructor(root) {
    this.root = root;
  }

  show(message) {
    const toast = h('div', { class: 'toast' }, message);
    this.root.append(toast);
    setTimeout(() => toast.remove(), 2800);
  }
}
