# Testing Strategy

This document defines the testing approach for the Fifteen game project.

The goal is not to automate everything immediately.
The goal is to build a practical regression process with good cost/benefit.

## Principles

We use two testing layers:

1. manual smoke testing
2. automated regression testing

Manual smoke tests are required:

- after backend migrations
- before production releases
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

## Why We Do Not Automate 100% Immediately

Full automation is a good long-term direction, but forcing 100% automation too early is expensive and slows delivery.

For this project, a realistic strategy is:

- keep a concise manual smoke checklist
- automate core logic first
- automate critical UI behavior second
- automate browser smoke scenarios third

This gives strong protection without overengineering.

## Current Manual Smoke Checklist

These checks must pass before release.

### A. Application Load

- Open the live site.
- Refresh with `Ctrl + F5`.
- Verify the page loads without a blank screen.
- Verify there are no obvious UI errors.

### B. Leaderboard Load

- Verify the leaderboard is visible.
- Verify old migrated records are present.
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

- Make several moves with the mouse.
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
- migration-related risks are reviewed if backend/storage changed
- automated tests are green once they are introduced

## Future Automation Plan

We will automate in this order:

1. unit tests for core game logic
2. unit tests for leaderboard sorting and pagination
3. integration tests for UI behavior
4. browser smoke tests
5. CI checks in GitHub Actions

## Change Log For Test Coverage

Whenever a feature is added, update this section.

Template:

- Feature:
- Release:
- Manual smoke added:
- Automated tests added:
- Notes:

## Current Recommendation

For this project:

- keep manual smoke testing as a required release step
- do not rely on manual testing only
- do not try to automate 100% before basic tooling exists
- gradually move repeated checks into automation
