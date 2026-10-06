import { UIComponent } from '../UIComponent.js';
import { empty, h } from '../utils.js';
import { getCollection } from './ListWidget.js';

export class StatisticsWidget extends UIComponent {
  static meta = { title: 'Статистика' };

  constructor(options) {
    super(options);
    this.charts = [];
  }

  #destroyCharts() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }

  renderBody() {
    this.#destroyCharts();

    const completed = getCollection(this.ctx, (record) => record.status === 'completed');

    if (!completed.length) {
      this.body.replaceChildren(empty('Пока слишком мало данных для статистики.'));
      return;
    }

    const getEpisodes = (record) => record.anime.episodes || record.progress || 0;
    const episodes = completed.reduce((sum, record) => sum + getEpisodes(record), 0);
    const minutes = completed.reduce(
      (sum, record) => sum + getEpisodes(record) * (record.anime.duration || 24),
      0,
    );
    const rated = getCollection(this.ctx, (record) => record.rating);
    const averageRating = rated.length
      ? (rated.reduce((sum, record) => sum + record.rating, 0) / rated.length).toFixed(1)
      : '—';
    const months = {};
    const genres = {};

    for (const record of completed) {
      const month = (record.completedAt || '').slice(0, 7);
      if (month) {
        months[month] = (months[month] || 0) + getEpisodes(record);
      }

      for (const genre of record.anime.genres || []) {
        genres[genre] = (genres[genre] || 0) + 1;
      }
    }

    const monthKeys = Object.keys(months).sort().slice(-6);
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const monthlyCanvas = h('canvas', {
      role: 'img',
      'aria-label': 'Эпизоды по месяцам',
    });
    const genreCanvas = h('canvas', {
      role: 'img',
      'aria-label': 'Популярные жанры',
    });

    const stat = (value, label) => h(
      'div',
      { class: 'stat' },
      h('b', {}, String(value)),
      h('span', {}, label),
    );

    this.body.replaceChildren(
      h(
        'div',
        { class: 'stats' },
        stat(completed.length, 'просмотрено'),
        stat(episodes, 'эпизодов'),
        stat(`≈${Math.round(minutes / 60)}`, 'часов'),
        stat(averageRating, 'средняя оценка'),
      ),
      h('p', { class: 'muted sm' }, 'Часы приблизительные: длительность серии берётся из API, а при отсутствии данных используется 24 минуты.'),
      h(
        'div',
        { class: 'charts' },
        h('div', { class: 'chartbox' }, monthlyCanvas),
        h('div', { class: 'chartbox' }, genreCanvas),
      ),
    );

    if (typeof Chart === 'undefined') {
      return;
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
    };

    this.charts = [
      new Chart(monthlyCanvas, {
        type: 'bar',
        data: {
          labels: monthKeys,
          datasets: [
            {
              label: 'Эпизоды',
              data: monthKeys.map((key) => months[key]),
              backgroundColor: '#b9a6fb',
              borderRadius: 8,
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: { legend: { display: false } },
        },
      }),
      new Chart(genreCanvas, {
        type: 'doughnut',
        data: {
          labels: topGenres.map(([genre]) => genre),
          datasets: [
            {
              data: topGenres.map(([, count]) => count),
              backgroundColor: ['#ff8fb8', '#7cc8ff', '#a78bfa', '#ffc2da', '#a9dcff', '#d4c9ff'],
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: { legend: { position: 'bottom' } },
        },
      }),
    ];
  }

  destroy() {
    this.#destroyCharts();
    super.destroy();
  }
}
