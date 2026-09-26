# Task: T01 2단 점프 패턴 3종 추가

## Status: done

## Goal

첫 구간부터 낮은 빈도로 등장하는 2단 점프 중심 장애물 패턴 3종을 추가한다. 새 패턴은 기존 `jump`/`slide` action candidate 검증과 호환되면서 `double_jump`라는 명시적 요구 action을 사용하고, 기존 패턴과 분리된 20% 선택 branch로 뽑힌다.

## Decision Summary

- 새 패턴 3종: `double-jump-basic`, `double-jump-slide`, `slide-double-jump`.
- 새 패턴은 `minZone`을 지정하지 않아 `home_day`부터 등장한다.
- 새 패턴 전체 등장 비중 목표는 약 20%다.
- 높은 상자 장애물은 기존 `box` 렌더러/충돌 polygon을 사용하되 `y: 600, height: 100`으로 기존 80px보다 1.25배 높인다.
- 점프력 1 고양이가 해당 높은 상자를 1단 점프로 회피할 수 있어야 한다.

## Implementation

### I01. action 후보와 패턴 정의

- Related Files:
  - `public/js/game/patterns.js` :: `GROUND_ACTIONS`, `LOW_ACTIONS`, 새 `DOUBLE_JUMP_ACTIONS`, `PATTERN_LIBRARY`, `PATTERN_VERSION`; modify

#### Details

- `DOUBLE_JUMP_ACTIONS`를 `Object.freeze(["double_jump"])`로 추가한다.
- `PATTERN_VERSION`을 `cat-runner-patterns-v6`으로 올린다.
- 각 새 패턴에 `family: "double-jump"`와 `advancedSafeMargin: 80`을 지정한다. 이 margin은 연속 장애물의 짧은 안전 간격을 표현하기 위한 값이며, 일반 패턴의 120/200 margin을 변경하지 않는다.
- `double-jump-basic`을 다음 논리로 정의한다.
  - `width: 1500`, `minGap: 260`, `safePath: "jump"`, `gapAnchor: { x: 1050 }`
  - 장애물 1: `{ x: 300, y: 620, width: 90, height: 80, variant: "box" }`
  - 장애물 2: `{ x: 470, y: 600, width: 90, height: 100, variant: "box" }`
  - `actionCandidates: [GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS]`
- `double-jump-slide`를 다음 논리로 정의한다.
  - `width: 1800`, `minGap: 260`, `safePath: "mixed"`, `gapAnchor: { x: 1250 }`
  - 장애물 1: 일반 box `{ x: 260, y: 620, width: 90, height: 80 }`
  - 장애물 2: 높은 box `{ x: 440, y: 600, width: 90, height: 100 }`
  - 장애물 3: 낮은 fence `{ x: 700, y: 560, width: 140, height: 40 }`
  - `actionCandidates: [GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS, LOW_ACTIONS]`
- `slide-double-jump`를 다음 논리로 정의한다.
  - `width: 1800`, `minGap: 260`, `safePath: "mixed"`, `gapAnchor: { x: 1250 }`
  - 장애물 1: 낮은 fence `{ x: 260, y: 560, width: 140, height: 40 }`
  - 장애물 2: 일반 box `{ x: 510, y: 620, width: 90, height: 80 }`
  - 장애물 3: 높은 box `{ x: 690, y: 600, width: 90, height: 100 }`
  - `actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, DOUBLE_JUMP_ACTIONS]`
- 각 패턴의 gap anchor와 entity 위치는 `isValidPattern`의 gapSafe 조건을 만족하도록 유지하고, `requiredActions`는 `createPatternStream`에서 candidate마다 하나씩 결정한다.
- `double_jump`는 공중에서 두 번째 W를 누르는 현재 `GAME_CONFIG.maxJumps = 2` 동작을 뜻한다. 별도의 세 번째 점프나 입력 키를 추가하지 않는다.

### I02. 새 패턴 20% 선택 branch

- Related Files:
  - `public/js/game/patterns.js` :: `createPatternStream`, 새 `selectPatternCandidate`; modify/new export

#### Details

- `selectPatternCandidate(candidates, random)`를 추가한다.
- `family === "double-jump"`인 candidate와 그 외 candidate를 각각 분리한다.
- 새 패턴과 기존 패턴이 모두 있으면 `random() < 0.2`일 때 새 패턴 그룹, 그 외에는 기존 패턴 그룹에서 균등 선택한다.
- 선택한 그룹이 비어 있으면 반대 그룹에서 균등 선택한다. `previousPatternId` 필터 이후 후보가 없어지는 경우에도 stream이 throw하지 않아야 한다.
- 기존 `Math.floor(random() * candidates.length)`를 이 helper 호출로 대체한다.
- 기존 패턴의 인접 반복 금지, 동일 seed 결정성, zone 필터를 유지한다.

### I03. 선택 분기 테스트

- Related Files:
  - `test/game-systems.test.js` :: pattern stream/zone gating tests; modify

#### Details

- `PATTERN_LIBRARY`에서 `family === "double-jump"` 패턴이 정확히 3개인지 검증한다.
- `createPatternStream(seed).next("home_day")` 표본에서 세 패턴이 모두 등장하고, 새 패턴 비율이 15% 이상 25% 이하인지 검증한다.
- 새 패턴이 `home_day`에서 등장하며, `outside`/`home_night`에서도 zone filter 때문에 계속 유효한지 검증한다.
- 새 패턴의 `requiredActions` 중 두 번째 또는 세 번째 action이 `double_jump`이고 해당 `actionCandidates`에 포함되는지 검증한다.
- 새 패턴 entity 간 간격과 `isValidPattern(pattern)`이 true인지 검증한다.

### I04. 서버 manifest parity

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `PATTERN_VERSION`, `PATTERNS`, `selectPatternCandidate`, `createServerManifest`; modify
  - `test/score-validation.test.js` :: client/server manifest parity and formation seed fixtures; modify

#### Details

- 서버 manifest에 동일한 3개 `family: "double-jump"` 패턴, `double_jump` action candidate, 100px high box, `advancedSafeMargin: 80`을 추가한다.
- 서버의 패턴 선택 branch와 client의 one-roll 20% selection mapping을 동일하게 유지한다.
- client/server `PATTERN_VERSION`을 `cat-runner-patterns-v6`으로 맞춘다.
- DEX 검증 fixture는 새 deterministic stream에서도 실제 DEX 진형을 생성하는 seed를 사용한다.

## Acceptance Criteria

- [ ] 새 패턴 3종이 첫 구간부터 등장한다.
- [ ] 새 패턴은 전체 후보 중 약 20%로 선택된다.
- [ ] 각 새 패턴은 2단 점프를 명시적으로 요구하는 action sequence를 가진다.
- [ ] 높은 장애물은 기존 box 시각/충돌 체계를 사용하면서 100px 높이로 표시된다.
- [ ] 기존 패턴과 새 패턴 모두 deterministic하고 인접 동일 패턴이 없다.

## Validation

- `npm test -- --test-name-pattern="zone gates|same seed|pattern stream|jump-slide"`
- `npm test`

## Commit Message

```text
feat(patterns): add weighted double jump obstacles

Plan: 2026-09-26-runner-stage-density-double-jump-patterns
Phase: P03-obstacle-double-jump-patterns
Task: T01-add-double-jump-patterns

- add three home-day double-jump pattern families
- select the new families at an approximately twenty-percent rate
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
