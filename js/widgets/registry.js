import { FavoriteWidget } from './FavoriteWidget.js';
import { WatchlistWidget } from './WatchlistWidget.js';
import { CompletedWidget } from './CompletedWidget.js';
import { ProgressWidget } from './ProgressWidget.js';
import { RandomAnimeWidget } from './RandomAnimeWidget.js';
import { StatisticsWidget } from './StatisticsWidget.js';
import { RatingsWidget } from './RatingsWidget.js';
import { RecommendationsWidget } from './RecommendationsWidget.js';
import { AiringCalendarWidget } from './AiringCalendarWidget.js';

export const registry = Object.freeze({
  favorite: FavoriteWidget,
  watchlist: WatchlistWidget,
  progress: ProgressWidget,
  completed: CompletedWidget,
  random: RandomAnimeWidget,
  statistics: StatisticsWidget,
  ratings: RatingsWidget,
  recommendations: RecommendationsWidget,
  airing: AiringCalendarWidget,
});
