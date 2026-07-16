# Fifteen Game

[![CI](https://github.com/alvayer-82/fifteen-game/actions/workflows/ci.yml/badge.svg)](https://github.com/alvayer-82/fifteen-game/actions/workflows/ci.yml)

Веб-версия игры "Пятнашки" с онлайн-таблицей рекордов на Firebase Firestore.

## Демо

[Открыть игру](https://alvayer-82.github.io/fifteen-game/)

## Возможности

- классическая игра "Пятнашки" 4x4;
- выбор имени игрока с подсказками из существующих записей;
- онлайн-таблица рекордов;
- сортировка результатов по игроку, ходам и времени;
- пагинация таблицы рекордов без перезагрузки страницы;
- автоматические unit-тесты и CI через GitHub Actions.

## Локальный запуск

Проект статический, поэтому для локального просмотра достаточно открыть `index.html` в браузере.

Для запуска тестов:

```bash
npm install
npm test
```

## Тестирование

- unit-тесты находятся в `tests/game-core.test.js` и `tests/leaderboard-core.test.js`;
- smoke-проверки и ручной контур описаны в `TESTING.md`;
- GitHub Actions автоматически запускает тесты на каждый push в `main` и на pull request.

## Архитектура

- `script.js` отвечает за UI и интеграцию с Firebase;
- `src/game-core.js` содержит игровую логику;
- `src/leaderboard-core.js` содержит логику сортировки, пагинации и обработки рекордов;
- `firestore.rules` содержит правила доступа Firestore.
