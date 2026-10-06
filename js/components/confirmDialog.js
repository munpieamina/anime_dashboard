import { h } from '../utils.js';

export function confirmDialog(modal, message) {
  return new Promise((resolve) => {
    let confirmed = false;

    modal.open(
      'Подтверждение удаления',
      h(
        'div',
        { class: 'confirm' },
        h('h2', {}, 'Удалить все данные?'),
        h('p', {}, message),
        h(
          'div',
          { class: 'row' },
          h(
            'button',
            { class: 'btn', type: 'button', autofocus: true, onclick: () => modal.close() },
            'Отмена',
          ),
          h(
            'button',
            {
              class: 'btn danger',
              type: 'button',
              onclick: () => {
                confirmed = true;
                modal.close();
              },
            },
            'Удалить',
          ),
        ),
      ),
      () => resolve(confirmed),
    );
  });
}
