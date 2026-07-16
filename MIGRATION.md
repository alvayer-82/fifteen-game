# Data Migration Guide

This project has already gone through one backend migration:

- From `Supabase` to `Firebase Firestore`
- Migration date: July 16, 2026

This document describes how future migrations should be done safely.

## Goals

Any backend or data migration must:

- preserve all production data
- avoid corrupting text encoding
- avoid losing writes while users are active
- provide a rollback path
- be verifiable before final cutover

## Core Rule

Never switch the application to a new backend before:

1. a full backup exists
2. the backup has been validated
3. the target backend is ready
4. test imports have been verified

## Recommended Migration Flow

### 1. Freeze the plan

Before touching production:

- define the source system
- define the target system
- define which tables/collections are moving
- define which fields must match exactly
- define rollback conditions

For this project the critical leaderboard fields are:

- `player`
- `moves`
- `time`
- created timestamp

### 2. Create a backup

Always export production data first.

Minimum requirements:

- export to `JSON` or `CSV`
- save export locally
- keep raw timestamps
- preserve `UTF-8`
- record export date/time

Checklist:

- backup file created
- file opens correctly
- Cyrillic names display correctly
- record count is known

### 3. Prepare the target backend

Before import:

- create the new project/environment
- create the target database/collection/table
- define access rules
- define indexes if needed
- verify that one manual test write works

### 4. Test import on a safe target

Do not import directly into live production data first.

Instead:

- import into a test collection/table
- verify counts
- verify sorting fields
- verify timestamps
- verify text encoding
- verify reads from the app

### 5. Use staged cutover for active production

If real users are playing during migration, use staged rollout:

- keep old backend active
- enable dual-write temporarily
- write new results to both systems
- read from old backend until verification passes
- switch reads to new backend only after validation

This avoids losing writes during the transition window.

### 6. Verify before cutover

Before switching production reads:

- compare record counts
- compare top leaderboard rows
- compare random samples
- verify non-Latin names
- verify latest writes

Minimum verification set:

- top 10 rows
- last 10 rows
- at least 10 random rows
- all distinct player names with non-ASCII characters

### 7. Cut over

Switch the app to the new backend only when:

- verification is complete
- rollback is still possible
- new writes are confirmed

### 8. Observe after cutover

After release:

- check that reads work
- check that new scores are saved
- check that pagination/sorting still works
- monitor for duplicate rows
- monitor for encoding issues

### 9. Decommission old backend

Do not delete the old backend immediately.

Keep it until:

- the new system is stable
- a final export has been archived
- rollback is no longer needed

## Encoding Safety

This project uses player names that may contain Cyrillic.

Migration rules:

- always use `UTF-8`
- avoid shell pipelines that silently change encoding
- validate imported names before production cutover
- use a small test document with Cyrillic text before bulk import

Recommended test string:

- `Супермэн`

If that string is corrupted, stop the migration.

## Rollback Policy

Rollback must be possible until the new backend is verified.

Rollback means:

- app reads return to the old backend
- dual-write remains enabled or old backend remains authoritative
- no destructive deletion of the old source until signoff

## Minimal Production Checklist

Before migration:

- backup created
- backup validated
- target backend created
- rules configured
- test write passed
- test import passed

During migration:

- record count tracked
- duplicate strategy defined
- encoding verified
- active writes accounted for

After migration:

- production read verified
- production write verified
- leaderboard verified
- rollback window still open

## Lessons From July 16, 2026 Migration

What went wrong:

- backend was switched before old data was explicitly preserved as a migration artifact
- Cyrillic names were imported once with broken encoding
- repair required a second collection and a second import pass

What should be done next time:

- export first
- validate encoding before bulk import
- use a test collection first
- use staged rollout if users are active

## Suggested Future Improvement

If this project becomes more active, add a migration layer:

- `leaderboardProvider`
- `readSource`
- `writeSource`
- optional dual-write mode

That will make future backend changes safer and easier to test.
