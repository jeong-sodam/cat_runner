# Task: T03 서버 이벤트 검증과 최고 점수

## Status: done

## Goal

클라이언트가 보낸 수집·충돌·거리 이벤트와 시간 정보를 서버에서 검증하고, 신뢰할 수 있는 최종 점수만 사용자별 최고 점수로 저장한다.

## Decision Summary

- 클라이언트가 보내는 최종 score를 신뢰하지 않는다.
- 서버는 런의 seed, pattern version, 이벤트 seq, timestamp, entity id를 검증한다.
- 점수는 쥐 인형 10점과 이동 거리 1m당 1점이며, 동점은 거리로 판정한다.

## Implementation

### I01. 검증 서비스와 이벤트 계약

- Related Files:
  - src/services/run-validation-service.js :: validateEventBatch(), calculateVerifiedResult(); new
  - src/game/server-pattern-manifest.js :: createServerManifest(seed); new
  - src/game/event-contract.js :: EVENT_TYPES, validateEvent(); new

#### Details

- Allowed event types: run_started, player_jump, slide_start, slide_end, mouse_collected, grass_collected, obstacle_collision, distance_checkpoint, run_gameover.
- Common fields: seq integer >= 0, type string, occurredAtMs integer >= 0, payload object.
- Verify seq begins at 0 or last acknowledged seq + 1, is strictly increasing, and has no duplicates.
- Verify occurredAtMs is nondecreasing and does not exceed the run duration plus 1000ms tolerance.
- createServerManifest(seed) uses the same pattern version and deterministic pattern generator as the client; entity ids must exist in the manifest and can be collected/collided once only.
- Verify mouse_collected entities are mouse entities, grass_collected entities are grass entities, and distance checkpoints never decrease.
- Recalculate health from obstacle_collision and invincibility event order. Reject a completed event stream that would have reached zero health before its reported gameover.
- Recalculate mouseCount, distanceM, grass effect sequence, and score. Positive effect double_score doubles mouse points only; distance remains floor(distanceM).

### I02. Completion route and leaderboard update

- Related Files:
  - src/routes/run-routes.js :: POST /api/runs/:runId/complete handler; modify
  - src/services/run-service.js :: completeVerifiedRun(); modify
  - src/db/repositories/leaderboard-repository.js :: upsertIfBetter(), getRankForUser(); modify

#### Details

- POST /api/runs/:runId/complete body { events: Event[], clientFinishedAt: number }.
- Append the final events, load all run events in seq order, validate once inside a transaction, and mark the run completed only after validation succeeds.
- Ignore any client score, distance, mouseCount, or rank fields.
- Response success:
  - { accepted: true, result: { score, distanceM, mouseCount, isPersonalBest, rank } }
- Invalid event responses:
  - HTTP 422 SCORE_EVENT_INVALID with a stable reason code
  - leave the run active for retry when validation is recoverable
  - mark run abandoned only for replayed or irreparably malformed streams
- getRankForUser counts records with higher score, or equal score and higher distance, or equal score/distance and earlier achievedAt.

### I03. Validation tests

- Related Files:
  - test/score-validation.test.js :: deterministic event stream and tamper tests; new

#### Details

- Test valid stream with mouse, grass, collision, distance, and gameover.
- Test duplicate seq, unknown entity, wrong entity type, decreasing distance, impossible timestamp, repeated collection, fake score fields, and cross-user run access.
- Test double score, invincible collision, slow miss, and 30 health depletion.
- Test personal-best replacement and tie rank.

## Acceptance Criteria

- [x] The server derives final score without trusting client score fields.
- [x] Tampered, duplicated, out-of-order, or impossible events are rejected.
- [x] Valid completion stores one completed run and updates best_scores only when better.
- [x] A lower subsequent score cannot replace the personal best.
- [x] Returned rank follows score DESC, distance DESC, achievedAt ASC.

## Validation

- node --test test/score-validation.test.js
- npm test

## Commit Message

~~~text
feat(score): validate run events and persist personal bests

Plan: 2026-09-21-cat-runner
Phase: P03-run-leaderboard-resume
Task: T03-server-score-validation

- validate deterministic collectible and distance events
- calculate authoritative final scores
- update one personal best and rank per user
~~~

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
