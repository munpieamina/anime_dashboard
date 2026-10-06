# Koi — Anime Dashboard

Учебный SPA-дешборд для любителей аниме: личная коллекция, статусы, прогресс, оценки, рецензии, рекомендации, расписание и поиск.

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

## Что исправлено

- Удалены все обращения к несуществующему `icon`: в интерфейсе больше нет пустых подписей и `undefined`.
- Декоративные эмодзи из UI убраны: кнопки используют обычные текстовые подписи.
- Поиск вынесен в `AnimeCatalogService`: сначала используется AniList, затем Jikan как резервный источник. Для популярных русских названий есть локальные алиасы.
- Названия аниме и жанры нормализуются в русскую отображаемую форму; старые записи в localStorage мигрируются автоматически.
- Для демо-коллекции добавлено автоматическое догружание постеров из API, если в localStorage постер отсутствует.
- Каждый виджет находится в отдельном файле.
- `main.js` отвечает только за запуск приложения и связку сервисов/компонентов.
- CSS разделён на базовые стили и стили компонентов.
- Исправлена лишняя логика повторного `append()` в `Dashboard.addWidget()`.
- API-запросы получили таймауты и корректное прерывание через `AbortController`.

## Запуск

ES Modules требуют HTTP-сервер. Например:

```bash
python -m http.server 8000
```

После этого откройте `http://localhost:8000`.

## API

- **Jikan** — поиск, подробности и случайное аниме.
- **AniList GraphQL** — поиск, постеры, рекомендации и расписание выхода.

Ключи API не требуются.

## Ограничение по русской локализации

Jikan и AniList не являются русскоязычными каталогами. Поэтому для наиболее популярных тайтлов проект содержит локальный словарь русских названий, а жанры переводятся общим словарём. Для остальных тайтлов используется доступное название из API.
