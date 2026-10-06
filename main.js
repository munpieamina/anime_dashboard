import { AddWidgetMenu } from './js/components/AddWidgetMenu.js';
import { confirmDialog } from './js/components/confirmDialog.js';
import { DetailsModal } from './js/components/DetailsModal.js';
import { Modal } from './js/components/Modal.js';
import { SearchBar } from './js/components/SearchBar.js';
import { Toast } from './js/components/Toast.js';
import { Dashboard } from './js/Dashboard.js';
import { EventBus } from './js/EventBus.js';
import { StorageService } from './js/StorageService.js';
import { AnimeCatalogService } from './js/services/AnimeCatalogService.js';
import { AniListService } from './js/services/AniListService.js';
import { JikanService } from './js/services/JikanService.js';
import { registry } from './js/widgets/registry.js';
import { loadDemo } from './js/demoData.js';

const $ = (selector) => document.querySelector(selector);

const bus = new EventBus();
const store = new StorageService(bus);
const toast = new Toast($('#toasts'));
const modal = new Modal($('#modal'));
const jikan = new JikanService();
const anilist = new AniListService();
const catalog = new AnimeCatalogService({ jikan, anilist });

const context = {
  bus,
  store,
  toast: (message) => toast.show(message),
  jikan,
  anilist,
  catalog,
  openDetails: null,
};

const details = new DetailsModal(modal, context);
context.openDetails = (anime) => details.open(anime);

const dashboard = new Dashboard($('#grid'), context, registry);
dashboard.loadLayout();

new SearchBar($('#search'), context);
new AddWidgetMenu($('#addMenu'), dashboard, registry);

bus.on('completed', () => context.toast('Аниме отмечено как просмотренное.'));

$('#demoBtn').addEventListener('click', async () => {
  loadDemo(store);
  dashboard.destroyAll();
  dashboard.loadLayout();
  context.toast('Демо-данные загружены.');
  await hydrateMissingPosters(context, dashboard);
});

$('#resetBtn').addEventListener('click', async () => {
  const confirmed = await confirmDialog(
    modal,
    'Будут удалены коллекция, оценки, рецензии, прогресс и расположение виджетов. Это действие нельзя отменить.',
  );

  if (!confirmed) {
    return;
  }

  store.clear();
  dashboard.destroyAll();
  context.toast('Все данные удалены.');
});

hydrateMissingPosters(context, dashboard);

async function hydrateMissingPosters(ctx, dash) {
  const records = ctx.store
    .list()
    .filter((record) => !record.anime.poster)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));

  for (const record of records.slice(0, 8)) {
    try {
      const freshAnime = await ctx.catalog.getAnimeById(record.anime.id);

      if (!freshAnime?.poster) {
        continue;
      }

      ctx.store.update(record.anime, freshAnime);
    } catch {
      // Poster hydration is optional and must never block the dashboard.
    }
  }

  dash.render();
}
