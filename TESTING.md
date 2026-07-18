# Testing Strategy

This document defines the testing approach for the Fifteen game project.

The goal is not to automate everything immediately.
The goal is to build a practical regression process with good cost/benefit.

## Principles

We use these layers:

1. manual smoke testing
2. automated unit regression
3. automated Firebase integration testing
4. automated local browser smoke
5. automated functional end-to-end browser testing
6. automated production smoke

Manual smoke tests are required:

- after backend migrations
- before major production releases
- after changes to user-critical flows

Automated tests are required:

- for stable logic that is easy to verify repeatedly
- for areas with high regression risk
- for behavior that should be checked on every change

## Decision Rule For New Features

When a new feature is added, decide:

1. Should it be added to manual smoke testing?
2. Should it be added to automated tests?
3. Should it be covered by both?

Use this rule:

- add to manual smoke if it affects the visible user flow
- add to automated tests if the behavior is deterministic and likely to regress
- add to both if the feature is critical and user-facing

## Current Manual Smoke Checklist

These checks must pass before release.

### A. Application Load

- Open the live site.
- Refresh with `Ctrl + F5`.
- Verify the page loads without a blank screen.
- Verify there are no obvious UI errors.

### B. Leaderboard Load

- Verify the leaderboard is visible.
- Verify migrated records are present.
- Verify Cyrillic names display correctly.
- Verify the leaderboard does not show placeholder error text.

### C. Leaderboard Sorting

- Click `Игрок` and verify sorting changes.
- Click `Игрок` again and verify reverse order.
- Click `Ходы` and verify sorting changes.
- Click `Ходы` again and verify reverse order.
- Click `Время` and verify sorting changes.
- Click `Время` again and verify reverse order.

### D. Leaderboard Pagination

- Click `Вперёд` and verify the next page opens.
- Click `Назад` and verify the previous page opens.
- Verify the visible row numbering is consistent.
- Verify pagination still works after changing sorting.

### E. Start Game

- Enter a new player name.
- Click `Старт`.
- Verify the board is shuffled.
- Verify the game begins normally.

### F. Gameplay

- Make several moves with the mouse or keyboard.
- Verify the move counter changes.
- Verify the timer starts.
- Verify invalid moves are rejected with a user message.
- Verify the hint button still works.

### G. Save Result

- Finish a game.
- Verify the success message says the result was saved.
- Verify the new result appears in the leaderboard.

### H. Refresh Persistence

- Refresh the page.
- Verify the saved result is still present.

### I. Player Suggestions

- Focus the player name input.
- Start typing an existing name.
- Verify suggestions appear.
- Select an existing player and start a game.

### J. Clean Session

- Open the site in incognito mode or another browser.
- Verify the leaderboard loads.
- Verify a new game can be started.

## Release Gate

A release is allowed only if:

- all required manual smoke checks pass
- known defects are reviewed and accepted
- migration-related risks are reviewed if backend or storage changed
- automated tests are green

## Automated Coverage Today

### Unit tests

- `tests/game-core.test.js`
- `tests/leaderboard-core.test.js`
- `tests/leaderboard-storage-core.test.js`

These protect pure logic and shared data transformation.

### Firebase integration tests

- `tests/integration/firestore-emulator.test.js`

This suite runs against Firestore Emulator and verifies:

- leaderboard read works
- leaderboard write works
- Firestore document mapping matches UI expectations
- denied reads are handled by rules
- invalid writes are rejected by rules
- loaded data supports sorting and pagination
- empty database returns an empty leaderboard

### Local browser smoke

- `tests/e2e/smoke.spec.js`

This suite runs against a controlled local page with deterministic test data.

### Functional end-to-end browser tests

- `tests/e2e/functional.spec.js`

This suite runs against a controlled local page and verifies full user scenarios:

- enter player name and start a session
- make a sequence of moves and verify UI updates
- choose an existing player from suggestions
- combine sorting and pagination in one session
- verify a saved result appears in the leaderboard in controlled test mode

### Production smoke

- `tests/e2e/production-smoke.spec.js`

This suite runs against the published GitHub Pages version.
It is intentionally read-only and must not write synthetic records into Firestore.

## Production Smoke Safety Rules

- do not intentionally finish the game in production tests
- do not intentionally write synthetic leaderboard records
- verify only loading, sorting, pagination and safe gameplay actions

## Automation Entry Points

- `npm test` runs unit regression
- `npm run test:integration` runs Firestore Emulator integration tests
- `npm run test:e2e` runs local Playwright smoke and functional end-to-end tests
- `npm run test:e2e:prod` runs read-only production smoke
- GitHub Actions workflow `CI` runs unit tests, Firebase integration and local Playwright smoke
- GitHub Actions workflow `Production Smoke` runs after successful `CI` on `main`

## Current Recommendation

For this project:

- keep manual smoke testing as a release safety net
- rely primarily on automated checks for repeated regression control
- keep production smoke read-only
- use Firebase Emulator as the main backend integration contour
