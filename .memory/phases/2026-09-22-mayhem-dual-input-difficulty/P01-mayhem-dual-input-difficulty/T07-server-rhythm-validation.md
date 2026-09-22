# Task: T07 서버 rhythm 계약과 authoritative 점수

## Status: pending

## Goal

`run_gameover`의 osu 요약 필드를 서버 계약에 추가하고, 클라이언트가 보낸 최종 정확도를 제한된 점수 배율로만 사용한다. 브라우저 랜덤 타겟을 서버가 재현하지 않는 결정은 유지하되, malformed/out-of-range accuracy와 보너스 조작을 거부하고 기존 obstacle/fall/entity/ownership 검증을 보존한다.

## Decision Summary

- `run_gameover.payload`의 rhythm fields는 optional로 두어 기존 이벤트 stream과 resume 호환을 유지한다.
- 정확도는 0~1 숫자, hit/miss/bonus count는 non-negative integer, bonus points는 `bonusHitCount * 5`와 일치해야 한다.
- 서버 score는 기존 authoritative base score에 rhythm multiplier `clamp(0.8 + accuracy * 0.4, 0.8, 1.2)`와 검증된 bonus points를 적용한다. 필드가 없으면 accuracy 1.0, bonus 0으로 backward-compatible 처리한다.
- 서버는 타겟 위치·타이밍을 재생성하지 않는다. 대신 count 상한은 event summary의 `hitCount + missCount`와 run duration에서 계산 가능한 범위로 제한한다.

## Implementation

### I01. Event contract and run-gameover schema

- Related Files:
  - `src/game/event-contract.js` :: `EVENT_TYPES`, `validateEvent`; modify
  - `public/js/sync/run-sync.js` :: event payload forwarding; read-only unless field normalization is needed
  - `public/js/app/app-controller.js` :: completion payload path; modify only if T03 fields are not forwarded

#### Details

- Keep `run_gameover` in `EVENT_TYPES`. Add optional payload validation for `rhythmAccuracy`, `rhythmHitCount`, `rhythmMissCount`, `rhythmBonusHits`, and `rhythmBonusPoints` only when present; absent fields pass for legacy runs.
- Reject NaN, Infinity, arrays, negative counts, accuracy outside [0,1], bonus hits greater than total hits, and bonus points other than `bonusHits * 5` with stable `SCORE_EVENT_INVALID` reasons.
- Preserve existing generic event sequence/time/payload checks and do not accept client-provided `score`, `health`, or `distanceM` as authoritative values.

### I02. Verified score calculation

- Related Files:
  - `src/services/run-validation-service.js` :: `validateEventStream`, `calculateVerifiedResult`, cat stats; modify
  - `src/services/run-service.js` :: completion result flow; modify only for returned rhythm metadata
  - `src/db/repositories/run-repository.js` :: stored result schema; modify only if rhythm accuracy is intentionally persisted

#### Details

- Keep existing server manifest entity/gap validation, invincibility authority, repeated ID checks, health depletion, gameover ordering, ownership, and run completion behavior.
- On the final `run_gameover`, parse optional rhythm summary. Default to `accuracy=1`, counts=0, bonus=0. Validate `hitCount + missCount` is within a conservative run-duration/500ms upper bound and `bonusHits <= hitCount`.
- Calculate `rhythmMultiplier = Math.min(1.2, Math.max(0.8, 0.8 + accuracy * 0.4))`. Apply it to the authoritative base score only after mouse/distance/effect score is derived, then add verified `bonusHits * 5`; round to a stable integer.
- Return `rhythmAccuracy`, `rhythmMultiplier`, and `rhythmBonusPoints` in the verified result if present, without trusting any client score field. Leaderboard stores the resulting verified score as before.
- Preserve optional patternVersion validation and update expected version to v4 from T02.

### I03. Security and integration tests

- Related Files:
  - `test/score-validation.test.js` :: rhythm score and malformed payload cases; modify
  - `test/security-regression.test.js` :: forged accuracy/bonus/version cases; modify
  - `test/integration.test.js` :: completed run with rhythm summary; modify
  - `test/run-resume.test.js` :: legacy gameover payload compatibility; modify only if assertions require it

#### Details

- Assert absent rhythm fields remain backward-compatible and valid 0/1 accuracy produces 0.8/1.2 multipliers.
- Assert valid bonus hits produce exactly +5 each and forged `score`, `health`, `distanceM`, excessive counts, invalid accuracy, mismatched bonus points, repeated events, unknown gaps/entities, and old pattern versions are rejected or ignored according to the existing contract.
- Assert a real run completion returns the verified rhythm-adjusted score and does not allow local-only runs to reach server routes.
- Keep existing clean-auth full suite behavior and note the known native cleanup abort separately if it persists.

## Acceptance Criteria

- [ ] Optional rhythm summary is validated and legacy runs still complete.
- [ ] Server computes bounded 0.8~1.2 accuracy multiplier and exact +5 bonus points authoritatively.
- [ ] Forged client score/health/distance and malformed rhythm fields cannot change verified result.
- [ ] Existing security, ownership, fall, collision, resume, and patternVersion contracts remain green.

## Validation

- `npm.cmd test -- test/score-validation.test.js test/security-regression.test.js test/integration.test.js test/run-resume.test.js`
- `$env:ENABLE_GUEST_MODE='false'; $env:ENTRA_CLIENT_ID=''; $env:ENTRA_CLIENT_SECRET=''; $env:ENTRA_TENANT_AUTHORITY=''; $env:ENTRA_REDIRECT_URI=''; npm.cmd test` — document only the pre-existing native cleanup abort if all assertions pass.

## Commit Message

```text
feat(server): validate rhythm summaries and bounded score bonuses

Plan: 2026-09-22-mayhem-dual-input-difficulty
Phase: P01-mayhem-dual-input-difficulty
Task: T07-server-rhythm-validation

- Validate optional osu accuracy and bonus fields
- Keep server score authoritative with bounded rhythm multipliers
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
