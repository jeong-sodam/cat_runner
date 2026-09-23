# Task: T02 Local Storage Fallback

## Status: done

## Goal

브라우저 `localStorage`가 차단되거나 쓰기 예외를 발생시켜도 현재 세션의 로컬 기록·최근 기록·개인 순위를 메모리에 보존하고 개인기록표를 열 수 있게 한다. 사용자에게는 영속 저장 실패와 세션 전용 유지 상태를 명확히 표시한다.

## Decision Summary

- persistent storage 성공 여부와 세션 메모리 기록 가능 여부를 분리한다.
- 저장 요청이 메모리 fallback에 성공하면 기록표와 순위 계산은 정상 동작한다.
- 새로고침 후 기록이 사라질 수 있다는 경고를 결과 화면에 표시한다.
- 기록 초기화 기능은 추가하지 않는다.

## Implementation

### I01. Local run store fallback 상태

- Related Files:
  - `public/js/sync/local-run-store.js` :: `resolveStorage`, `createLocalRunStore`, `persistHistory`, `getLocalHistory`, `saveLocalResult`, `saveLastResult`; modify
  - `test/run-resume.test.js` :: storage failure/fallback tests; modify/add

#### Details

- **Fallback state** inside `createLocalRunStore`:
  - `fallbackHistory: LocalScoreRecord[] | null`
  - `fallbackLastResult: LocalScoreRecord | null`
  - `storageWarning: boolean`
  - `persistent: boolean`
- The store must expose:
  ```js
  getStorageStatus() -> {
    persistent: boolean,
    warning: boolean,
  }
  ```
- `persistent` is true only when the current history/latest writes succeed in the supplied storage. `warning` is true when storage is unavailable, throws, or the in-memory storage substitute is being used.
- When `LOCAL_HISTORY_KEY` or `LOCAL_SCORES_KEY` cannot be read, `getLocalHistory()` must use `fallbackHistory` if present instead of returning an empty list. Normal storage migration behavior from T01 remains intact.
- `persistHistory(history)` behavior:
  1. Attempt to write full history and top-five cache.
  2. If both writes succeed, clear fallback history, set `persistent: true`, and return `true`.
  3. If either write fails, copy the normalized history into `fallbackHistory`, set `persistent: false` and `warning: true`, and return `false` without discarding the records.
- `saveLocalResult(record)` returns the existing record/rank fields plus:
  ```js
  {
    saved: boolean,      // true when persistent or fallback memory accepted it
    persisted: boolean,  // true only when browser storage accepted it
    warning: boolean,
    ranked: boolean,
    rank: number | null,
    entries: LocalScoreRecord[],
    totalEntries: number,
  }
  ```
- `saveLastResult(record)` must also retain the normalized record in `fallbackLastResult` when storage writes fail and continue returning a truthy success indicator for the active session. `getLastResult()` reads fallback latest data before returning null.
- Successful writes after a fallback should replace fallback state with persistent state while retaining all records accumulated during the fallback session.
- Existing `LOCAL_HISTORY_KEY`, `LOCAL_SCORES_KEY`, `LOCAL_LAST_RESULT_KEY`, migration, sorting, and rank semantics remain compatible.

### I02. Result and personal-record warning state

- Related Files:
  - `public/js/app/app-controller.js` :: local branch of `completeGameover`; modify
  - `public/js/ui/result-screen.js` :: local saved status/badge; modify
  - `public/js/ui/personal-records.js` :: persistent-warning notice; modify
  - `test/app-flow.test.js` :: fallback result and personal-records warning tests; modify/add

#### Details

- In local `completeGameover`, treat a fallback-accepted result as viewable/saved for the current session, but pass `persisted`/`storageWarning` to the result object.
- Result object fields for this path:
  - `saved: true` when either browser storage or fallback memory accepted the record
  - `persisted: boolean`
  - `storageWarning: boolean`
  - `rank`, `catId`, `achievedAt`, `localOnly`
- When `storageWarning` is true, result status must communicate both outcomes: the record is available in the current session, but a reload/browser close may remove it. Do not show server save retry.
- `personal-records.js` must show the same warning near the local records heading or latest-result block while still rendering rows and the latest rank.
- Persistent success keeps the normal `개인기록표에 저장되었습니다.` message without the warning.

### I03. Fallback tests

- Related Files:
  - `test/run-resume.test.js` :: storage write/read failure tests; modify/add
  - `test/app-flow.test.js` :: result/personal panel warning flow; modify/add

#### Details

- Use a storage adapter whose `setItem` and `getItem` throw. Save at least six records and verify the top five, full rank, and latest result remain available from memory.
- Verify `saveLocalResult` reports `saved: true`, `persisted: false`, and `warning: true` for fallback acceptance.
- Verify `getStorageStatus()` reports non-persistent warning state and does not expose storage exception details to UI.
- Simulate local gameover with fallback status and assert the result screen has no `저장 재시도`, retains the rank, and explains session-only persistence.
- Open `개인기록표` after fallback and assert rows/latest result are visible with the warning.

## Acceptance Criteria

- [ ] `localStorage` 실패가 개인기록표 화면 진입을 막지 않는다.
- [ ] 저장 실패 후에도 현재 세션에서 최고 5개와 개인 순위가 유지된다.
- [ ] 결과 화면과 개인기록표에 세션 전용 유지 경고가 표시된다.
- [ ] 서버 저장 재시도 버튼이 fallback 로컬 결과에 표시되지 않는다.
- [ ] 정상 storage 환경의 기존 영속 저장 동작이 유지된다.

## Validation

- `node --test --test-concurrency=1 test/run-resume.test.js`
- `node --test --test-concurrency=1 test/app-flow.test.js`

## Commit Message

```text
feat(storage): keep local records available when browser storage fails

Plan: 2026-09-23-local-mode-osu-ease
Phase: P01-local-mode-osu-ease
Task: T02-local-storage-fallback

- retain local records in memory when persistent storage is blocked
- surface session-only persistence warnings in result and records screens
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`node --test --test-isolation=none --test-concurrency=1 test/run-resume.test.js`, `node --test --test-isolation=none --test-concurrency=1 test/app-flow.test.js`)
- commit: a5da260
