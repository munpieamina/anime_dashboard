# Koi — Anime Dashboard

## Структура

```text
index.html
main.js
js/
├── UIComponent.js          # базовый класс виджетов
├── Dashboard.js            # управление коллекцией виджетов
├── EventBus.js             # события приложения
├── StorageService.js       # localStorage
├── Localization.js         # русские названия и жанры
├── demoData.js             # тестовая коллекция
├── utils.js                # общие DOM и форматирующие функции
├── components/
│   ├── AddWidgetMenu.js
│   ├── DetailsModal.js
│   ├── Modal.js
│   ├── SearchBar.js
│   ├── Toast.js
│   └── confirmDialog.js
├── services/
│   ├── AniListService.js
│   ├── AnimeCatalogService.js
│   └── JikanService.js
└── widgets/
    ├── ListWidget.js       # общий базовый класс списочных виджетов
    ├── FavoriteWidget.js
    ├── WatchlistWidget.js
    ├── ProgressWidget.js
    ├── CompletedWidget.js
    ├── RandomAnimeWidget.js
    ├── StatisticsWidget.js
    ├── RatingsWidget.js
    ├── RecommendationsWidget.js
    ├── AiringCalendarWidget.js
    └── registry.js
styles/
├── main.css                # базовые стили приложения
└── components.css          # стили виджетов и компонентов
```

## API

- **Jikan** — поиск, подробности и случайное аниме.
- **AniList GraphQL** — поиск, постеры, рекомендации и расписание выхода.


