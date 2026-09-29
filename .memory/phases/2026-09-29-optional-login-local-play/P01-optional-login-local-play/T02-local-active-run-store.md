# Task: T02 Local Active-Run Store

## Status: done

## Goal

Add validated browser-local in-progress storage without userId while preserving the existing save/load/clear contract used by authenticated server run synchronization.

## Decision Summary

- Use the existing cat-runner:active-run key.
- Local records have no server identity or expiry and remain until discard/completion.
- Completed score history and last-result keys are unchanged.

## Implementation

### I01. Define the local active-run schema and API

- Related Files:
  - public/js/sync/local-run-store.js :: LOCAL_RUN_KEY; read-only
  - public/js/sync/local-run-store.js :: createLocalRunStore; modify
  - public/js/sync/local-run-store.js :: saveLocalRun, loadLocalRun, clearLocalRun; new returned methods

#### Details

- Local record fields are mode=local, runId string, catId string, seed string, snapshotVersion=1, snapshot object, and savedAt number.
- saveLocalRun(run) requires catId, seed, version 1, and object snapshot; preserves runId or generates local-<timestamp>-<catId>; forces mode local; uses a finite savedAt or Date.now(); returns true/false for storage write.
- loadLocalRun() returns a normalized record or null; reject and clear malformed JSON, wrong mode, missing/invalid runId/catId/seed, wrong version, or non-object snapshot.
- clearLocalRun() removes the active-run key safely.
- Keep existing save/load/clear behavior for createRunSync; do not require mode local for server records.

### I02. Add store tests

- Related Files:
  - test/run-resume.test.js :: createLocalRunStore coverage; modify/add

#### Details

- With in-memory storage, test no-userId round-trip, generated runId, malformed/wrong-mode/wrong-version/non-object rejection and clearing, and clearLocalRun preserving score-history keys.
- Rerun existing server run-sync tests to prove the legacy contract remains intact.

## Acceptance Criteria

- [ ] Local active runs persist/load without userId, expiresAt, or server calls.
- [ ] Invalid local records are safely rejected and removed.
- [ ] Existing server run-sync and score-history tests pass.

## Validation

- node --test test/run-resume.test.js

## Commit Message

    feat(storage): add browser-local active run persistence

    Plan: 2026-09-29-optional-login-local-play
    Phase: P01-optional-login-local-play
    Task: T02-local-active-run-store

    - persist local snapshots without user IDs
    - preserve authenticated run-sync storage

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: 1d271e3
