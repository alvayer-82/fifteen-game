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
- автоматические unit, Firebase integration и Playwright проверки через GitHub Actions.

## Локальный запуск

Проект статический, поэтому для локального просмотра можно открыть `index.html` в браузере.

Для запуска тестов:

```bash
npm install
npm test
npm run test:integration
npm run test:e2e
npm run test:e2e:prod
```

`npm run test:integration` автоматически поднимает Firestore Emulator.
Для локального emulator-контура нужна Java 21+.

## Тестирование

- `npm test` запускает unit-тесты для игровой логики и логики таблицы рекордов;
- `npm run test:integration` запускает Firebase Firestore Emulator и integration-тесты на чтение, запись и security rules;
- `npm run test:e2e` запускает локальный детерминированный Playwright smoke-контур;
- `npm run test:e2e:prod` запускает read-only smoke-проверки против опубликованной GitHub Pages-версии;
- workflow `CI` проверяет unit, Firebase integration и local browser smoke на каждом `push` в `main` и на каждом `pull request`;
- workflow `Production Smoke` проверяет опубликованную GitHub Pages-версию после успешного `CI` на `main` и может запускаться вручную.

## Архитектура

- `script.js` отвечает за UI и интеграцию с Firebase;
- `src/game-core.js` содержит игровую логику;
- `src/leaderboard-core.js` содержит сортировку, пагинацию и обработку рекордов;
- `src/leaderboard-storage-core.js` содержит общий формат и маппинг leaderboard-записей между Firebase и UI;
- `firestore.rules` содержит правила доступа Firestore;
- `tests/integration/firestore-emulator.test.js` содержит обязательный backend integration-контур.
