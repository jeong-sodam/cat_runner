# Task: T02 zone 장애물 밀도와 seed 행동 시퀀스

## Status: pending

## Goal

모든 zone에서 기본 패턴의 장애물을 1개씩 늘리고 복합 패턴을 4개 장애물로 확장한다. 복합 패턴의 4단계 jump/slide 행동은 seed 기반으로 클라이언트와 서버가 같은 결과를 만들며, 일반 패턴은 기존 안전 여백을 보존하고 일부 복합 패턴만 120px 여백의 연속 회피를 허용한다.

## Decision Summary

- `home_day`도 기본 패턴이 기존보다 1개 많아지고, `outside`/`home_night`는 기존 zone-only obstacle에 더해 기본 패턴 증가분을 가진다.
- 복합 패턴은 4개 장애물, 장애물별 shape-aware action 후보, seed 기반 action metadata다.
- 클라이언트와 서버의 PRNG 소비 순서는 후보 선택 → gap roll → gap width → 복합 action roll 4회 → grass effect roll이다.
- 기존 `cat-runner-patterns-v3` 버전은 유지하지 않고 행동 시퀀스·기하 변경에 맞춰 `cat-runner-patterns-v4`로 올린다.

## Implementation

### I01. 클라이언트 pattern library와 action generator

- Related Files:
  - `public/js/game/patterns.js` :: `PATTERN_VERSION`, `PATTERN_LIBRARY`, `isValidPattern`, `createPatternStream`; modify
  - `public/js/game/world.js` :: `spawnNextPattern`, `updateWorldEntities`; read-only unless new metadata must be copied

#### Details

- 기본 패턴 `jump-basic`, `slide-basic`, `mixed-safe`에 source obstacle을 1개 추가한다. 기존 outside-only extra entity는 source entity 뒤에 유지해 기존 entity index/ID 순서를 보존한다. 새 entity는 기존 box/fence/pot/yarn variant만 사용하고, `home_day`에서도 활성화되는 source obstacle이어야 한다.
- 복합 패턴 6개는 모두 entity 4개와 `requiredActions` 4개를 반환한다. obstacle placement는 이전 obstacle의 실제 `x + width` 뒤 최소 120px를 두고, 마지막 obstacle 끝은 gap anchor 앞 최소 120px 이상 남긴다. 일반 패턴의 200px gap-safe validation은 유지하고 복합 패턴만 `advancedSafeMargin: 120`을 사용한다.
- `createPatternStream.next(zoneId)`는 현재 zone gating과 no-adjacent-repeat을 유지한다. 패턴을 선택한 후 gap roll과 gap width를 소비하고, 복합 패턴인 경우 obstacle별 action candidate에서 random을 정확히 1회씩 소비한다. ground box/pot는 `jump`만, low fence/yarn은 `jump` 또는 `slide` 중 shape에 맞는 후보만 허용한다. 생성 후 `isActionSequenceValid`가 모든 장애물에 대한 회피 가능성과 120px 여백을 검증한다.
- 반환 pattern에는 `requiredActions`, `minZone`, `gaps`, entity IDs, `patternIndex`를 포함한다. 기존 gap 생성 확률·gap ID·entity collected/hitByPlayer 필드는 보존한다.
- `PATTERN_VERSION`을 `cat-runner-patterns-v4`로 바꾸고, T01에서 변경한 속도·health와 pattern stream이 독립적으로 동작하도록 한다.

### I02. 서버 manifest parity

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `PATTERN_VERSION`, `PATTERNS`, `createServerManifest`; modify
  - `public/js/sync/run-sync.js` :: `startRun`; modify only to consume the new shared client version

#### Details

- 서버 `PATTERNS`는 클라이언트와 같은 source entity 순서, 위치, 크기, variant, `minZone`, action candidate 규칙을 가져야 한다. `createServerManifest(seed, { patternCount, zoneId })`의 default zone과 existing `getEntity`/`getGap` API는 유지한다.
- client/server PRNG 함수와 action roll 순서를 동일하게 유지한다. server generated entity는 absolute x, client entity는 pattern-relative x이므로 parity test는 `serverEntity.x - startX`를 비교한다.
- `patterns[].requiredActions`, `minZone`, `gaps[].width`, `gaps[].id`, entity ID·width·height·variant를 비교할 수 있게 manifest record를 유지한다. base extra entity는 기존 source entity 뒤에 append하여 home_day ID를 깨지 않는다.
- manifest version을 `cat-runner-patterns-v4`로 맞추고 run-start event가 shared `PATTERN_VERSION`을 사용하게 한다. 이전 v3 이벤트는 T07에서 mismatch로 거부한다.

### I03. 패턴·parity·회피 테스트

- Related Files:
  - `test/game-systems.test.js` :: density, action validity, zone gating, safe spacing tests; modify
  - `test/score-validation.test.js` :: client/server v4 manifest parity; modify
  - `test/security-regression.test.js` :: pattern version fixture; modify if required

#### Details

- 240회 이상 stream에서 home_day/outside/night의 base obstacle count가 각각 기존 baseline보다 1 증가하고, 복합 패턴은 항상 4개인지 검증한다.
- 동일 seed·zone에서 client/server pattern IDs, entity IDs, relative x, dimensions, variants, `requiredActions`, gap IDs/widths가 일치하는지 검증한다.
- home_day에 composite가 나오지 않고 outside/night에서 6개 composite가 모두 나오며, action sequence가 shape/action 규칙을 위반하지 않는지 검증한다.
- 실제 collision geometry 또는 기존 simulation helper를 사용해 120px advanced pattern이 연속 action으로 회피 가능하고, 일반 pattern의 기존 safe margin이 유지되는지 검증한다.

## Acceptance Criteria

- [ ] 기본 패턴·복합 패턴의 장애물 수가 결정값대로 증가한다.
- [ ] v4 client/server manifest가 같은 seed에서 ID·기하·action metadata·gap을 재현한다.
- [ ] 120px 고난도 복합 패턴은 회피 가능하고 일반 패턴은 기존 안전 계약을 유지한다.
- [ ] run-start patternVersion과 security fixtures가 v4로 동기화된다.

## Validation

- `npm.cmd test -- test/game-systems.test.js test/score-validation.test.js test/security-regression.test.js`

## Commit Message

```text
feat(game): increase obstacles with deterministic action sequences

Plan: 2026-09-22-mayhem-dual-input-difficulty
Phase: P01-mayhem-dual-input-difficulty
Task: T02-zone-obstacle-patterns

- Add four-obstacle patterns and shape-aware action sequences
- Keep client and server pattern manifests in parity
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
