# Task: T02 런 저장·연결 복구·이어하기

## Status: done

## Goal

실행 중인 런을 서버와 브라우저에 저장하고, 연결이 끊기면 게임을 멈춘 뒤 복구 시점부터 재개한다. 브라우저 종료·새로고침 후에도 24시간 내 저장된 런을 묻고 이어할 수 있게 한다.

## Decision Summary

- 연결 끊김 중에는 게임을 진행하지 않는다.
- 검증 이벤트와 게임 snapshot을 임시 저장한다.
- 저장된 런은 24시간 후 만료되며, 재접속 시 사용자에게 이어하기를 묻는다.

## Implementation

### I01. Run API와 서버 snapshot

- Related Files:
  - src/routes/run-routes.js :: registerRunRoutes(app, deps); new
  - src/services/run-service.js :: startRun(), appendRunEvents(), saveRunSnapshot(), getResumableRun(); new

#### Details

- All routes requireAuth.
- POST /api/runs body { catId }:
  - validate catId against six shared ids
  - server generates a cryptographically random seed and UUID run id
  - create active run with startedAt=now, expiresAt=now+86400000
  - response { runId, seed, catId, expiresAt }
- POST /api/runs/:runId/events body { events: Event[] }:
  - verify route user owns active run
  - append sequence-ordered events transactionally
  - response { acceptedThroughSeq }
- PUT /api/runs/:runId/snapshot body { snapshotVersion: 1, snapshot: RunSnapshot }:
  - only active owner run
  - save snapshot JSON and refresh updatedAt without extending expiresAt
- GET /api/runs/resumable:
  - delete or mark expired active runs first
  - return the newest active run summary and snapshot, or { run: null }
- POST /api/runs/:runId/abandon marks active run abandoned and does not write a score.

### I02. Client event buffer and local snapshot

- Related Files:
  - public/js/sync/run-sync.js :: createRunSync(apiClient, localStore); new
  - public/js/sync/local-run-store.js :: createLocalRunStore(storage); new
  - public/js/sync/network-monitor.js :: createNetworkMonitor(onOffline, onOnline); new

#### Details

- Event shape: { seq: number, type: string, occurredAtMs: number, payload: object }.
- localStorage key cat-runner:active-run stores { runId, userId, catId, snapshotVersion, snapshot, pendingEvents, savedAt }.
- Flush events in order; retry with exponential delays 500ms, 1s, 2s, max 5s.
- On offline or fetch failure, pause game, save snapshot and pending events, show reconnect state. Do not advance simulation.
- On online, POST pending events, PUT latest snapshot, then resume from the last acknowledged state.
- On bootstrap, call GET /api/runs/resumable. If both server and local state are valid and expiresAt > now, show a modal asking continue or start new. Start new calls abandon for the old run.
- Delete local state after successful completed or abandoned run.

### I03. Resume tests

- Related Files:
  - test/run-resume.test.js :: API ownership, expiry, buffer, retry, and resume tests; new

#### Details

- Verify a user cannot read or append another user's run.
- Verify offline mode pauses and does not lose pending event order.
- Verify a 24-hour-old run is not offered.
- Verify continue restores catId, seed, worldOffset, score, health, active effect, and pending event sequence.
- Verify starting a new run abandons the old one without creating a leaderboard record.

## Acceptance Criteria

- [x] Connection failure pauses the game and preserves snapshot plus events.
- [x] Reconnection sends events in sequence before resuming.
- [x] Browser reload within 24 hours offers continue; after 24 hours it offers only a new run.
- [x] A user cannot resume or mutate another user's run.
- [x] Incomplete or abandoned runs never enter the leaderboard.

## Validation

- node --test test/run-resume.test.js
- npm test
- Manual: throttle/offline the browser, confirm pause, restore network, confirm continuation.

## Commit Message

~~~text
feat(run): persist active runs and support offline resume

Plan: 2026-09-21-cat-runner
Phase: P03-run-leaderboard-resume
Task: T02-run-persistence-resume

- add authenticated run lifecycle endpoints
- buffer events and snapshots through network loss
- restore resumable runs for 24 hours
~~~

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
