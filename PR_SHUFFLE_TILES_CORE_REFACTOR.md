# Pull Request Package

## Title

`refactor: move shuffleTiles into game core`

## Summary

- Логика `shuffleTiles` вынесена из `script.js` в `src/game-core.js`.
- UI-код теперь использует core-функцию вместо локальной реализации.
- Добавлены unit-тесты, которые фиксируют поведение `shuffleTiles` на уровне core-слоя.

## Why this change

- Сейчас `shuffleTiles` является частью игровой логики, но жил в UI-слое.
- Это мешало полноценно покрыть функцию unit-тестами и держало важную логику вне core-модуля.
- Цель изменения: сделать проект более test-driven без изменения пользовательского поведения.

## Technical changes

- В `src/game-core.js` добавлен экспорт `shuffleTiles(size = BOARD_SIZE, random = Math.random)`.
- В `script.js` удалена локальная реализация `shuffleTiles`.
- В `script.js` добавлен импорт `shuffleTiles` из `src/game-core.js`.
- В `tests/game-core.test.js` добавлены unit-тесты на:
  - генерацию solvable, но не solved доски;
  - корректную работу для `3x3`;
  - повторную попытку, если первая перестановка случайно оставляет solved-состояние.

## Risk assessment

### Потенциально затронутые сценарии

- старт новой игры;
- генерация стартового поля;
- сохранение прежнего пользовательского поведения после переноса логики в core.

### Почему риск считается приемлемым

- алгоритм перенесен без изменения продуктового сценария;
- логика shuffle теперь покрыта unit-тестами;
- браузерный e2e-контур подтверждает, что запуск игры после рефакторинга не сломан.

### Остаточный риск

- низкий.

## Testing

### Added tests

- Новый unit-тест:
  - `shuffles tiles into a solvable non-solved board`
- Новый unit-тест:
  - `shuffles tiles correctly for 3x3 boards`
- Новый unit-тест:
  - `retries shuffling when the first permutation stays solved`

### Existing tests still passing locally

- `npm test` -> `38/38 passed`
- `npm run test:e2e` -> `19/19 passed`

## Files changed

- `src/game-core.js`
  - перенос `shuffleTiles` в core-слой
- `script.js`
  - переход на использование core-функции
- `tests/game-core.test.js`
  - unit-покрытие для `shuffleTiles`

## Review focus

Прошу отдельно проверить:

1. Корректно ли перенесена `shuffleTiles` логика из UI-слоя в core.
2. Не изменилось ли поведение алгоритма shuffle после переноса.
3. Достаточно ли новые unit-тесты действительно защищают от регрессии.
4. Нет ли скрытого побочного эффекта на старт новой игры или на существующий e2e-сценарий.
