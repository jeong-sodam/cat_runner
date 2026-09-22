# Task: T03 osu 스타일 타겟 엔진과 정확도 상태

## Status: done

## Goal

왼손 키보드 러너와 독립적으로 동작하는 브라우저 랜덤 osu 타겟 엔진을 추가한다. 타겟은 500ms 동안 표시되고, 일반/보너스 타입과 성공·실패·정확도·보너스 점수를 게임 상태에 기록한다. zone별 1/2/3 동시 타겟과 `home_day 1.0x → outside 1.5x → home_night 2.0x` 난이도를 적용하며, 게임 종료 시 서버 전송용 rhythm summary를 제공한다.

## Decision Summary

- 타겟은 seed가 아니라 브라우저 random source로 생성하며 테스트에서는 injectable random source를 사용한다.
- 판정은 성공/실패 2단계다. 각 target은 `expiresAtMs = spawnedAtMs + 500`이고 시간 초과 시 독립적으로 miss 처리된다.
- 좌클릭은 normal, 우클릭은 bonus이며 bonus는 전체의 20%, 성공 시 +5점, 실패 시 일반 miss와 동일하게 accuracy에 반영된다.
- accuracy는 `hits / (hits + misses)`로 계산하고 0회 처리 시 1.0을 사용한다. 결과 배율은 0.8~1.2로 clamp한다.

## Implementation

### I01. Rhythm target data model

- Related Files:
  - `public/js/game/rhythm-targets.js` :: new `RHYTHM_CONFIG`, `createRhythmState`, `updateRhythmTargets`, `resolveRhythmTarget`, `getRhythmSummary`
  - `public/js/game/state.js` :: `createGameState`; add rhythm state
  - `public/js/game/constants.js` :: rhythm constants/zone scale; modify or export read-only values

#### Details

- `RHYTHM_CONFIG` must define `targetLifetimeMs: 500`, `bonusChance: 0.2`, `bonusPoints: 5`, `accuracyMin: 0`, `accuracyMax: 1`, `scoreMultiplierMin: 0.8`, `scoreMultiplierMax: 1.2`, and zone metadata `{ home_day: { activeCount: 1, difficultyScale: 1 }, outside: { activeCount: 2, difficultyScale: 1.5 }, home_night: { activeCount: 3, difficultyScale: 2 } }`.
- Target schema is `{ id, x, y, radius, button: "primary"|"secondary", spawnedAtMs, expiresAtMs, status: "active"|"hit"|"miss" }`. Coordinates are logical Canvas coordinates and may overlap world entities.
- Rhythm state schema is `{ targets, hitCount, missCount, bonusHitCount, bonusPoints, nextTargetId, lastSpawnAtMs, randomSource }`; `randomSource` is runtime-only and must not be serialized into snapshots.
- `createRhythmState({ randomSource = Math.random } = {})` returns a state with no active targets and zero counters. `updateRhythmTargets(state, { nowMs, zoneId, canvasWidth, canvasHeight })` expires active targets independently, records misses, and fills active targets until the zone active count is reached. Position and bonus type use only the injected random source.
- Target radius decreases as the zone difficulty scale rises and spawn interval decreases by the same scale. Clamp radius so a target remains clickable within the Canvas; do not avoid world entities.
- `resolveRhythmTarget(state, { x, y, button, nowMs })` finds an active target containing the pointer and requiring the matching button. A successful primary/secondary target increments hit count; secondary success increments bonusHitCount and bonusPoints by exactly 5. A click that does not resolve a target has no effect.

### I02. Game loop and score summary integration

- Related Files:
  - `public/js/game/game-loop.js` :: `createGameLoop`, `simulateStep`; modify
  - `public/js/game/scoring.js` :: `calculateScore`, `updateScore`; modify
  - `public/js/app/app-controller.js` :: `playEventSound`, `completeGameover`; read-only contract for emitted summary

#### Details

- Call `updateRhythmTargets` once per fixed simulation step after elapsed time advances and before `onStep`/render notification. Pausing the game must pause target timers because elapsed time does not advance while paused.
- Add rhythm bonus points to the local score calculation and apply the cat `scoreMultiplier` and rhythm accuracy multiplier only once. Do not let `updateScore` double-count bonus points on every frame.
- `getRhythmSummary` returns `{ accuracy, hitCount, missCount, bonusHitCount, bonusPoints, scoreMultiplier }`, where `accuracy` is 0~1 and `scoreMultiplier = clamp(0.8 + accuracy * 0.4, 0.8, 1.2)`.
- On lethal gameover, emitted `run_gameover.payload` includes `distanceM`, `rhythmAccuracy`, `rhythmHitCount`, `rhythmMissCount`, `rhythmBonusHits`, and `rhythmBonusPoints`. Existing event order and distance payload remain intact.
- Snapshot serialization must omit `randomSource` and retain active target/counters only when a server-backed run is resumable. Local mode may keep the same serializable rhythm fields.

### I03. Rhythm unit tests

- Related Files:
  - `test/game-systems.test.js` :: rhythm state, expiry, scoring, zone counts; modify
  - `test/game-core.test.js` :: pause/gameover summary behavior; modify

#### Details

- Inject a deterministic random source and verify normal/bonus target schemas, position bounds, 500ms expiry, independent misses, and active counts 1/2/3 by zone.
- Verify left/right button matching, bonus +5, ignored wrong-button clicks, accuracy calculation, and 0.8~1.2 multiplier clamping.
- Verify pausing freezes target expiry, gameover emits the summary once, and repeated score updates do not duplicate bonus points.

## Acceptance Criteria

- [ ] Browser-random targets support independent 500ms success/miss resolution and zone active counts.
- [ ] Normal/bonus click behavior, +5 bonus, accuracy, and 0.8~1.2 multiplier are represented in state and score.
- [ ] Existing keyboard jump/slide, pause, gameover, and score contracts remain intact.
- [ ] `run_gameover` includes the agreed rhythm summary fields without serializing runtime random functions.

## Validation

- `npm.cmd test -- test/game-systems.test.js test/game-core.test.js`

## Commit Message

```text
feat(game): add browser-random rhythm target engine

Plan: 2026-09-22-mayhem-dual-input-difficulty
Phase: P01-mayhem-dual-input-difficulty
Task: T03-rhythm-target-engine

- Track zone-scaled normal and bonus mouse targets
- Add accuracy and rhythm score summary to gameover events
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

## Execution Record

- Implementation complete
- Validation passed: `npm.cmd test -- test/game-systems.test.js test/game-core.test.js` (20 tests)
- Commit: pending
