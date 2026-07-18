# Pull Request Package

## Title

`feat: add first and last leaderboard pagination buttons`

## Summary

- Added two new pagination buttons to the leaderboard:
  - `Первая`
  - `Последняя`
- A player can now jump to the first or last leaderboard page in one click.
- The implementation reuses the existing pagination state and page-count logic instead of duplicating it.

## Required behavior covered

- `Первая` opens the first leaderboard page.
- `Последняя` opens the last leaderboard page.
- On the first page, `Первая` and `Назад` are disabled.
- On the last page, `Вперёд` and `Последняя` are disabled.
- When only one page exists, all four pagination buttons are disabled.

## Technical changes

- Updated `renderLeaderboardPagination` in `script.js`.
- Extended the shared pagination click handler to support:
  - `first`
  - `prev`
  - `next`
  - `last`
- Kept one shared next-page calculation path for all actions.

## Risk assessment

### Potentially affected scenarios

- existing `Назад` / `Вперёд` behavior;
- disabled-state logic on first and last pages;
- interaction between sorting and pagination;
- production smoke behavior on the published app.

### Why the risk is acceptable

- Core pagination helpers were not changed.
- The change is localized to the leaderboard UI layer.
- The new behavior is covered by Playwright tests.
- Existing end-to-end scenarios remain green after the change.

### Residual risk

- Low.

## Testing

### Updated tests

- `tests/e2e/smoke.spec.js`
  - verifies `Первая` and `Последняя` are rendered;
  - verifies first/last page navigation on a 3-page fixture with 25 records;
  - verifies all four buttons are disabled when only one page exists.
- `tests/e2e/functional.spec.js`
  - verifies sorting and pagination still work together;
  - now checks a non-trivial jump to the last page on a 3-page fixture.
- `tests/e2e/production-smoke.spec.js`
  - verifies production pagination exposes first/last controls and can navigate across pages.

### Local verification

- `npm test`
- `npm run test:e2e`

## Why no new unit tests

- Pagination core logic in `src/leaderboard-core.js` was not changed.
- The feature only changes UI wiring around existing pagination helpers.
- The most valuable regression coverage here is Playwright, because the change is user-facing and DOM-driven.

## Files changed

- `script.js`
- `tests/e2e/smoke.spec.js`
- `tests/e2e/functional.spec.js`
- `tests/e2e/production-smoke.spec.js`

## Review focus

Please pay special attention to:

1. Whether old `Назад` / `Вперёд` behavior still works without regression.
2. Whether the new buttons are integrated into the existing logic cleanly.
3. Whether disabled states are correct on first / last / single-page states.
4. Whether Playwright coverage is now sufficient for a real jump-to-first / jump-to-last scenario.
