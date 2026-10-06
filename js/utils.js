export function createElement(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (name.startsWith('on') && typeof value === 'function') {
      element.addEventListener(name.slice(2), value);
      continue;
    }

    element.setAttribute(name, value === true ? '' : String(value));
  }

  element.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
  return element;
}

export const h = createElement;

export const STATUS = Object.freeze({
  watching: 'Смотрю',
  completed: 'Просмотрено',
  plan: 'Хочу посмотреть',
  dropped: 'Брошено',
});

export const empty = (text) => createElement('p', { class: 'empty' }, text);

export function safeUrl(url) {
  return /^https:\/\//.test(url || '') ? url : null;
}

export function keepFocus(root, render) {
  const controlsBefore = [...root.querySelectorAll('button, textarea, input, select')];
  const focusedIndex = controlsBefore.indexOf(document.activeElement);

  render();

  if (focusedIndex >= 0) {
    const controlsAfter = [...root.querySelectorAll('button, textarea, input, select')];
    controlsAfter[focusedIndex]?.focus();
  }
}

export function countdown(timestamp) {
  const minutes = Math.max(0, Math.round((timestamp * 1000 - Date.now()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;

  if (days) {
    return `через ${days} д ${hours} ч`;
  }

  if (hours) {
    return `через ${hours} ч ${remainingMinutes} мин`;
  }

  return `через ${remainingMinutes} мин`;
}

export function formatGenres(genres = []) {
  return genres.slice(0, 3).join(', ');
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Date(dateValue).toLocaleDateString('ru-RU');
}

export function getDisplayTitle(anime) {
  return anime?.titleRussian || anime?.title || 'Без названия';
}

export function getDisplayStatus(status) {
  return STATUS[status] || status || '';
}

export function mergeAnimeData(base, patch) {
  return {
    ...(base || {}),
    ...(patch || {}),
    genres: patch?.genres?.length ? patch.genres : base?.genres || [],
    titleRussian: patch?.titleRussian || base?.titleRussian || patch?.title || base?.title || 'Без названия',
    title: patch?.title || base?.title || patch?.titleRussian || base?.titleRussian || 'Без названия',
    poster: patch?.poster || base?.poster || null,
  };
}

export function animeCard(anime, ctx, actions = []) {
  const record = ctx.store.get(anime.id);
  const title = getDisplayTitle(anime);
  const poster = safeUrl(anime.poster);
  const image = poster
    ? createElement('img', {
        class: 'anime-poster',
        src: poster,
        alt: `Постер: ${title}`,
        loading: 'lazy',
      })
    : createElement('div', {
        class: 'ph',
        role: 'img',
        'aria-label': `Постер для «${title}» пока недоступен`,
      });

  if (poster) {
    image.addEventListener('error', () => {
      image.replaceWith(
        createElement('div', {
          class: 'ph',
          role: 'img',
          'aria-label': `Постер для «${title}» пока недоступен`,
        }),
      );
    });
  }

  const subtitle = [
    anime.year,
    formatGenres(anime.genres || []),
    anime.episodes ? `${anime.episodes} эп.` : '? эп.',
  ]
    .filter(Boolean)
    .join(' · ');

  const badges = [
    record?.favorite ? 'Любимое' : null,
    record?.status ? getDisplayStatus(record.status) : null,
    record?.rating ? `Оценка: ${record.rating}/10` : null,
    anime.score && !record?.rating ? `MAL ${anime.score}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return createElement(
    'article',
    { class: 'acard' },
    image,
    createElement(
      'div',
      { class: 'ainfo' },
      createElement(
        'button',
        {
          class: 'atitle',
          type: 'button',
          onclick: () => ctx.openDetails(anime),
        },
        title,
      ),
      createElement('p', { class: 'muted' }, subtitle),
      badges ? createElement('p', { class: 'badges' }, badges) : null,
      actions.length
        ? createElement(
            'div',
            { class: 'row' },
            actions.map(([label, handler]) =>
              createElement(
                'button',
                { class: 'btn sm', type: 'button', onclick: handler },
                label,
              ),
            ),
          )
        : null,
    ),
  );
}
