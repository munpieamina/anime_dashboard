import { UIComponent } from '../UIComponent.js';
import { animeCard, empty, h } from '../utils.js';
import { updateRecord } from './ListWidget.js';

export class RandomAnimeWidget extends UIComponent {
  static meta = { title: 'Случайное аниме' };

  constructor(options) {
    super(options);
    this.current = null;
    this.state = 'idle';
  }

  async roll() {
    this.state = 'loading';
    this.refresh();

    try {
      const anime = await this.request((signal) => this.ctx.jikan.getRandomAnime(signal));

      if (!anime) {
        return;
      }

      this.current = anime;
      this.state = 'ready';
    } catch {
      this.state = 'error';
    }

    this.refresh();
  }

  renderBody() {
    const { current } = this;

    const view =
      this.state === 'loading'
        ? empty('Загружаем случайное аниме...')
        : this.state === 'error'
          ? empty('Не удалось получить случайное аниме. Проверьте соединение и попробуйте ещё раз.')
          : current
            ? animeCard(current, this.ctx, [
                [
                  'Хочу посмотреть',
                  () => updateRecord(this, { anime: current }, { status: 'plan' }, 'Добавлено в список.'),
                ],
                [
                  'Добавить в любимое',
                  () => updateRecord(this, { anime: current }, { favorite: true }, 'Добавлено в любимое.'),
                ],
                ['Подробнее', () => this.ctx.openDetails(current)],
              ])
            : empty('Нажмите кнопку, чтобы получить случайное аниме.');

    this.body.replaceChildren(
      h(
        'button',
        { class: 'btn primary', type: 'button', onclick: () => this.roll() },
        current ? 'Получить другое' : 'Случайное аниме',
      ),
      view,
    );
  }
}
