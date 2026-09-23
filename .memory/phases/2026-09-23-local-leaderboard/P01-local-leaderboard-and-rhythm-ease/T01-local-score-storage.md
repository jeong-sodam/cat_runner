# Task: T01 Local Score Storage

## Status: done

## Goal

Replace the single local-best persistence path with a backward-compatible local top-five score store and a persisted latest-result record, while preserving the existing active-run storage and legacy best APIs.

## Decision Summary

- Source of truth: `.memory/decisions/2026-09-23-local-leaderboard.md`, D01–D04 and D06.
- Records are device-local, combine all cats, and sort by score descending, distance descending, then `achievedAt` ascending.
- The existing `cat-runner:local-best` record must migrate automatically into the new list without being discarded.

## Implementation

### I01. Define local score schema and migration

- Related Files:
  - `public/js/sync/local-run-store.js` :: `LOCAL_BEST_KEY`, `createLocalRunStore`, `getLocalBest`, `saveLocalBest`, `clearLocalBest` — modify; retain active-run APIs unchanged.
  - `public/js/sync/local-run-store.js` :: new `LOCAL_SCORES_KEY`, `LOCAL_LAST_RESULT_KEY`, `normalizeScoreRecord`, `compareScoreRecords`, `getLocalScores`, `saveLocalResult`, `getLastResult`, `saveLastResult`, `clearLocalScores` — add.

#### Details

- **Storage keys**:
  - `LOCAL_SCORES_KEY = "cat-runner:local-scores"` stores a JSON array of normalized score records.
  - `LOCAL_LAST_RESULT_KEY = "cat-runner:last-result"` stores one normalized latest-result record.
  - Keep `LOCAL_BEST_KEY = "cat-runner:local-best"` readable for migration and compatibility.
- **Record shape**:
  ```js
  {
    score: number,
    distanceM: number,
    mouseCount: number,
    rhythmAccuracy: number,
    catId: string,
    achievedAt: number
  }
  ```
  Normalize non-finite numeric values to `0`, use `black` for an invalid `catId`, and use `Date.now()` when `achievedAt` is absent/invalid.
- `compareScoreRecords(a, b)` returns the ordering for score descending, distance descending, and achieved time ascending.
- `getLocalScores()` reads the array, filters malformed records, sorts it, and returns at most five records. If the new key is absent and a valid legacy `LOCAL_BEST_KEY` exists, normalize it, write it as the first new-list entry, and return it as the migrated list. Do not delete the legacy key during migration.
- `saveLocalResult(record)` normalizes the record, inserts it into the score list, sorts, persists only the top five, and returns an object containing at least `{ saved, ranked, rank, record, entries }`; `rank` is 1-based when the record is in the top five and `null` otherwise. Equal records must remain deterministic through `achievedAt`.
- `saveLastResult(record)` always persists the normalized latest record independently of whether it reached the top five. `getLastResult()` returns the normalized record or `null`; malformed storage is cleared safely.
- Keep `getLocalBest()` returning the first personal score or `null`, and make `saveLocalBest()` a compatibility wrapper that uses the new ordering/record storage. `clearLocalBest()` must clear both the legacy best and new score list; add `clearLastResult()` for explicit test cleanup.
- Storage failures remain non-throwing and return `saved: false`/`null` as appropriate; no server or authentication dependency is introduced.

### I02. Add persistence regression coverage

- Related Files:
  - `test/run-resume.test.js` :: local store tests near `local best records replace only when score, distance, or time improves` — modify.

#### Details

- Assert five mixed-cat records sort by score, distance, and earlier timestamp and records below fifth are excluded.
- Assert a latest result is returned even when it is outside the top five.
- Assert an existing `LOCAL_BEST_KEY` record migrates into `getLocalScores()` exactly once and remains readable through `getLocalBest()`.
- Assert malformed score arrays and latest-result JSON are cleared without throwing.
- Preserve active-run sync and existing legacy-best assertions.

## Acceptance Criteria

- [x] Local storage returns a deterministic all-cat top-five list.
- [x] Existing single-best data migrates without loss and legacy APIs remain compatible.
- [x] Latest result persists independently of top-five eligibility.
- [x] Storage failures and malformed data do not crash the app.

## Validation

- `npm.cmd test -- test/run-resume.test.js` — local store and run-sync regression tests pass; if Windows native SQLite cleanup aborts before assertions, rerun the non-database local-store cases in the same test file and record the environment limitation.
- `git diff --check`

## Commit Message

```text
feat(storage): add local top-five score history

Plan: 2026-09-23-local-leaderboard
Phase: P01-local-leaderboard-and-rhythm-ease
Task: T01-local-score-storage

- Migrate the legacy local best into a top-five score list
- Persist the latest local result for leaderboard display
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending

## Execution Record

- Added `cat-runner:local-scores` and `cat-runner:last-result` storage with normalized all-cat records, deterministic top-five ordering, and malformed-data cleanup.
- Migrated the legacy `cat-runner:local-best` record on first score-list read and preserved `getLocalBest`/`saveLocalBest` compatibility behavior.
- Validation: `npm.cmd test -- test/run-resume.test.js` (10 passed); `git diff --check` passed.
