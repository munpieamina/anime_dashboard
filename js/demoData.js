import { TITLE_MAP } from './Localization.js';

const daysAgo = (days) => new Date(Date.now() - days * 864e5).toISOString();

const anime = (id, title, year, episodes, genres, duration) => ({
  id,
  title,
  titleRussian: TITLE_MAP[id] || title,
  year,
  poster: null,
  genres,
  episodes,
  duration,
});

export const DEMO_ROWS = [
  [
    anime(5114, 'Fullmetal Alchemist: Brotherhood', 2009, 64, ['Action', 'Adventure', 'Drama', 'Fantasy'], 24),
    {
      status: 'completed',
      favorite: true,
      rating: 10,
      progress: 64,
      completedAt: daysAgo(160),
      reviewText: 'Идеальный баланс сюжета и персонажей. Финал — один из лучших.',
    },
  ],
  [
    anime(16498, 'Attack on Titan', 2013, 25, ['Action', 'Drama', 'Fantasy'], 24),
    {
      status: 'completed',
      favorite: true,
      rating: 10,
      progress: 25,
      completedAt: daysAgo(125),
      reviewText: 'Невероятное напряжение и неожиданные повороты.',
    },
  ],
  [
    anime(1535, 'Death Note', 2006, 37, ['Mystery', 'Supernatural', 'Suspense'], 23),
    {
      status: 'completed',
      rating: 9,
      progress: 37,
      completedAt: daysAgo(95),
      reviewText: 'Дуэль умов, которая не отпускает до конца.',
    },
  ],
  [
    anime(9253, 'Steins;Gate', 2011, 24, ['Drama', 'Sci-Fi', 'Suspense'], 24),
    {
      status: 'completed',
      favorite: true,
      rating: 9,
      progress: 24,
      completedAt: daysAgo(70),
    },
  ],
  [
    anime(38000, 'Demon Slayer', 2019, 26, ['Action', 'Fantasy'], 23),
    {
      status: 'completed',
      rating: 8,
      progress: 26,
      completedAt: daysAgo(45),
    },
  ],
  [
    anime(40748, 'Jujutsu Kaisen', 2020, 24, ['Action', 'Fantasy'], 23),
    {
      status: 'completed',
      favorite: true,
      rating: 8,
      progress: 24,
      completedAt: daysAgo(25),
      reviewText: 'Отличная анимация боёв, второй сезон чуть слабее.',
    },
  ],
  [
    anime(52991, "Frieren: Beyond Journey's End", 2023, 28, ['Adventure', 'Drama', 'Fantasy'], 24),
    {
      status: 'completed',
      favorite: true,
      rating: 9,
      progress: 28,
      completedAt: daysAgo(10),
      reviewText: 'Очень понравилась атмосфера и персонажи.',
    },
  ],
  [
    anime(11061, 'Hunter x Hunter (2011)', 2011, 148, ['Action', 'Adventure', 'Fantasy'], 23),
    { status: 'watching', progress: 62 },
  ],
  [
    anime(59978, "Frieren: Beyond Journey's End Season 2", 2026, 10, ['Adventure', 'Drama', 'Fantasy'], 24),
    { status: 'watching', progress: 4 },
  ],
  [
    anime(21, 'One Piece', 1999, null, ['Action', 'Adventure', 'Fantasy'], 24),
    { status: 'watching', progress: 1100 },
  ],
  [
    anime(50265, 'Spy x Family', 2022, 12, ['Action', 'Comedy'], 24),
    { status: 'plan' },
  ],
  [
    anime(30276, 'One Punch Man', 2015, 12, ['Action', 'Comedy'], 24),
    { status: 'plan' },
  ],
  [
    anime(1, 'Cowboy Bebop', 1998, 26, ['Action', 'Sci-Fi'], 24),
    { status: 'plan' },
  ],
  [
    anime(20, 'Naruto', 2002, 220, ['Action', 'Adventure', 'Fantasy'], 23),
    { status: 'dropped', progress: 45 },
  ],
];

export function loadDemo(store) {
  const collection = {};

  DEMO_ROWS.forEach(([currentAnime, patch], index) => {
    const completedAt = patch.completedAt || null;
    collection[currentAnime.id] = {
      anime: currentAnime,
      status: null,
      favorite: false,
      progress: 0,
      rating: null,
      addedAt: daysAgo(200 - index * 10),
      completedAt: null,
      ratedAt: completedAt,
      review: patch.reviewText
        ? {
            text: patch.reviewText,
            createdAt: completedAt || daysAgo(5),
            updatedAt: completedAt || daysAgo(5),
          }
        : null,
      ...patch,
    };
  });

  store.write('collection', collection);
  store.write('profile', { name: 'Алекс' });
  store.write('layout', [
    'favorite',
    'progress',
    'statistics',
    'ratings',
    'recommendations',
    'airing',
  ].map((type) => ({ type, min: false })));
}
