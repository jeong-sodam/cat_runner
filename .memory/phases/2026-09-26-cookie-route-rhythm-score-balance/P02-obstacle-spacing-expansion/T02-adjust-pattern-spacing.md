# Task: T02 패턴 사이 spacing factor 조정과 서버 parity

## Status: done

## Goal

패턴 블록 사이의 실제 간격을 현재 `0.6375`에서 `0.733`으로 변경해 기본 `minGap: 240`의 실제 간격을 약 176px로 늘린다. client world와 server manifest가 같은 spacing 계산을 사용하고, 기존 player minimum gap 135px 하한을 유지한다.

## Decision Summary

- client `PATTERN_SPACING_FACTOR`와 server spacing factor는 모두 `0.733`이다.
- `safeMinimumGap = GAME_CONFIG.playerWidth * 1.5` 또는 server `PLAYER_WIDTH * 1.5` 하한은 변경하지 않는다.
- 내부 geometry 확장(P02-T01)과 외부 패턴 spacing은 서로 다른 보정이며 둘 다 적용한다.

## Implementation

### I01. client/server spacing

- Related Files:
  - `public/js/game/world.js` :: `PATTERN_SPACING_FACTOR`, `resolvePatternSpacing`, `spawnNextPattern`; modify
  - `src/game/server-pattern-manifest.js` :: `createServerManifest` nextPatternX calculation; modify

#### Details

- client `PATTERN_SPACING_FACTOR = 0.733`으로 변경한다.
- `resolvePatternSpacing(pattern)`은 `Math.max(pattern.minGap * 0.733, GAME_CONFIG.playerWidth * 1.5)`를 반환한다.
- server manifest의 `nextPatternX` 계산도 `Math.max(selected.minGap * 0.733, PLAYER_WIDTH * 1.5)`를 사용한다.
- startX, worldOffset, pattern width를 변경하지 않고 spacing 계산만 변경한다. `state.nextPatternX`가 실제 expanded pattern width 뒤에 추가 간격을 두도록 한다.

### I02. spacing regression tests

- Related Files:
  - `test/game-systems.test.js` :: spacing test; modify
  - `test/score-validation.test.js` :: client/server manifest entity sequence test; modify if expected positions change

#### Details

- `resolvePatternSpacing({ minGap: 240 }) === 175.92` 또는 구현의 정수 좌표 정책에 맞춘 `176`을 검증한다. 테스트는 소수 계산을 사용할 경우 `Math.abs(actual - 175.92) < 1e-9`로 작성한다.
- `minGap: 150`은 기존처럼 `135`보다 작아지지 않는지 검증한다.
- 각 zone에서 `spawnNextPattern` 후 `nextPatternX`가 expanded width + spacing factor를 반영하는지 확인한다.
- 동일 seed의 client/server pattern sequence가 spacing 변경으로 entity ID나 gap ID를 달리하지 않는지 확인한다.

## Acceptance Criteria

- [ ] client/server spacing factor가 `0.733`으로 일치한다.
- [ ] 기본 minGap 240의 실제 간격이 약 176px이다.
- [ ] player minimum gap 135px 하한이 유지된다.
- [ ] expanded pattern width와 spacing이 함께 적용된다.

## Validation

- `node test/game-systems.test.js`
- `node test/score-validation.test.js`

## Commit Message

```text
feat(world): relax pattern-to-pattern spacing

Plan: 2026-09-26-cookie-route-rhythm-score-balance
Phase: P02-obstacle-spacing-expansion
Task: T02-adjust-pattern-spacing

- increase pattern spacing to the selected safety factor
- keep client and server world spacing in sync
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history
