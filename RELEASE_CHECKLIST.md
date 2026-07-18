# Release Checklist

This checklist defines the minimum release process for the Fifteen Game project.

Use it before every public release.

## 1. Code Readiness

- Verify the target code is committed locally.
- Verify the working tree is clean with `git status`.
- Verify the release version is agreed.
- Verify release notes are prepared if user-visible behavior changed.

## 2. Automated Test Gate

Run these commands locally:

```bash
npm test
npm run test:integration
npm run test:e2e
npm run test:e2e:prod
```

Release is blocked if any of these fail.

## 3. What Each Command Proves

- `npm test`
  Confirms pure logic is stable:
  game rules, sorting, pagination, mapping, service behavior.

- `npm run test:integration`
  Confirms Firebase integration is stable in Firestore Emulator:
  reads, writes, validation rules, error handling.

- `npm run test:e2e`
  Confirms local browser behavior is stable:
  smoke coverage plus functional end-to-end user scenarios.

- `npm run test:e2e:prod`
  Confirms the published GitHub Pages version is alive and safe after deployment.

## 4. Manual Release Smoke

These manual checks are still required before public release:

- Open the live site in a normal browser session.
- Open the live site in incognito mode.
- Start a game with a new player name.
- Make several moves.
- Verify the timer and move counter change.
- Verify sorting works.
- Verify pagination works.
- Save a result and confirm it appears in the leaderboard.
- Refresh the page and confirm the saved result is still present.
- Verify Cyrillic names display correctly.

## 5. Firebase-Specific Checks

- Verify Firestore is available.
- Verify Firestore rules are published.
- Verify the application still reads from the expected collection.
- Verify there was no accidental production test data pollution.

## 6. Release Decision

Release is allowed only if:

- all automated tests are green
- manual release smoke passed
- no known blocker defects remain
- backend/storage risks were reviewed if data logic changed

## 7. After Release

- Open the published version once more.
- Re-run `npm run test:e2e:prod` if the deployment changed after final verification.
- Create the GitHub release/tag.
- Record major testing notes if the release involved migration or backend changes.
