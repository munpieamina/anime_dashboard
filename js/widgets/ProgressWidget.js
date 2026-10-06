import { h, empty, getDisplayTitle } from '../utils.js';
import { UIComponent } from '../UIComponent.js';
import { getCollection, updateRecord } from './ListWidget.js';

export class ProgressWidget extends UIComponent {
  static meta = { title: 'Прогресс просмотра' };

  items() {
    return getCollection(this.ctx, (record) => record.status === 'watching');
  }

  renderBody() {
    const items = this.items();

    if (!items.length) {
      this.body.replaceChildren(empty('Начните смотреть аниме, и здесь появится ваш прогресс.'));
      return;
    }

    this.body.replaceChildren(
      ...items.map((record) => {
        const anime = record.anime;
        const total = anime.episodes;
        const progress = record.progress;
        const percentage = total ? Math.min(100, Math.round((progress / total) * 100)) : 0;
        const title = getDisplayTitle(anime);
        const setProgress = (value) => updateRecord(this, record, { progress: value });

        const input = h('input', {
          type: 'number',
          min: 0,
          max: total || null,
          value: progress,
          class: 'num',
          'aria-label': `Текущий эпизод: ${title}`,
        });

        input.addEventListener('change', () => setProgress(Number(input.value)));

        return h(
          'div',
          { class: 'prow' },
          h(
            'button',
            {
              class: 'atitle',
              type: 'button',
              onclick: () => this.ctx.openDetails(anime),
            },
            title,
          ),
          h(
            'p',
            { class: 'muted' },
            total
              ? `${progress} / ${total} эпизодов · ${percentage}%`
              : `${progress} эпизодов · общее количество неизвестно`,
          ),
          h(
            'div',
            {
              class: 'bar',
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': total || Math.max(progress, 1),
              'aria-valuenow': progress,
              'aria-label': `Прогресс: ${title}`,
            },
            h('i', { style: `width:${percentage}%` }),
          ),
          h(
            'div',
            { class: 'row' },
            h(
              'button',
              {
                class: 'btn sm icon-btn',
                type: 'button',
                'aria-label': 'Меньше',
                title: 'Меньше',
                onclick: () => setProgress(progress - 1),
              },
              h('span', { class: 'icon', 'aria-hidden': 'true' }, '−'),
            ),
            input,
            h(
              'button',
              {
                class: 'btn sm icon-btn',
                type: 'button',
                'aria-label': 'Больше',
                title: 'Больше',
                onclick: () => setProgress(progress + 1),
              },
              h('span', { class: 'icon', 'aria-hidden': 'true' }, '+'),
            ),
            !total
              ? h(
                  'button',
                  {
                    class: 'btn sm',
                    type: 'button',
                    onclick: () =>
                      updateRecord(this, record, { status: 'completed' }, 'Аниме отмечено как просмотренное.'),
                  },
                  'Завершить',
                )
              : null,
          ),
        );
      }),
    );
  }
}
