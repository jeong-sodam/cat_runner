# Task: T01 도트아트 생성기

## Status: done ✅

## Goal

게임 패턴 스트림이 장애물과 겹치지 않는 빈 구간에 사용할 5×5 도트아트와 DEX 특별 이벤트를 시드 기반으로 결정하도록 만든다. 일반 쥐 수를 약 2배로 늘리되 도트아트가 선택된 구간에서는 일반 쥐를 대체한다.

## Decision Summary

- 하트·별·클로버·따봉·알파벳을 동일 확률로 선택하며 전체 도트아트 발생 확률은 약 20%다.
- 알파벳은 A~Z에서 무작위 선택하고, 알파벳 선택 시 5% 확률로 D→E→X를 선택한다.
- 쥐 크기는 42×42를 유지하고 셀 간격은 촘촘하게 배치한다. 모든 도트는 일반 수집 쥐다.

## Implementation

### I01. 공유 가능한 도트 마스크와 생성 결과 모델

- Related Files:
  - `public/js/game/mouse-formations.js` :: new module; create
  - `public/js/game/patterns.js` :: `createPatternStream`, pattern metadata; modify

#### Details

- `public/js/game/mouse-formations.js`에 5×5 boolean mask 상수를 만든다. 이름은 `heart`, `star`, `clover`, `thumbsUp` 및 `alphabet`으로 관리하고 알파벳은 A~Z mask table을 제공한다.
- 각 mask는 25칸 배열 또는 5개 문자열로 표현하되, 좌상단부터 행 우선 순서가 결정론적으로 유지되어야 한다. 빈 칸은 entity를 생성하지 않는다.
- `FORMATION_CELL_SIZE = 42`, `FORMATION_CELL_STEP = 34`, `FORMATION_WIDTH = 178`, `FORMATION_HEIGHT = 178`을 export하여 월드 배치와 테스트가 같은 값을 사용한다.
- `createFormation(randomSource, options)`은 `{ kind, label, cells, width, height, isDex }` 형태를 반환한다. `cells`는 `{ column, row }` 목록이며 5×5 범위를 벗어나지 않는다.
- `createPatternStream.next(zoneId)`는 먼저 기존 패턴 선택과 gap RNG를 수행한 뒤 별도의 formation roll을 사용한다. roll이 0.2 미만이고 충분한 안전 영역을 가진 패턴이면 도트아트를 생성한다.
- formation kind는 5종을 동일 확률로 선택한다. kind가 alphabet이면 A~Z를 동일 확률로 선택하고, 그 뒤 0.05 미만이면 `isDex: true`인 DEX 결과를 만든다.
- 일반 formation은 `obstacleSuppressed: false`, DEX는 `obstacleSuppressed: true`, `sequence: ['D','E','X']` 메타데이터를 갖는다.
- formation 선택 시 해당 패턴의 일반 mouse entity를 제거하고, 선택되지 않은 패턴에는 기존 mouse entity를 추가 배치해 기본 mouse entity 수가 기존 대비 대략 2배가 되게 한다. 추가 위치는 obstacle polygon과 최소 `GAME_CONFIG.gapSafeMargin`만큼 분리하고, 필수 jump/slide action 경로를 침범하지 않는다.

### I02. 패턴 안전성 검증

- Related Files:
  - `public/js/game/patterns.js` :: `isValidPattern`, `freezePattern`; modify
  - `test/game-systems.test.js` :: formation generator tests; modify

#### Details

- 도트아트 anchor는 pattern의 obstacle entity와 겹치지 않아야 하고, pattern 양 끝과 `FORMATION_WIDTH`를 수용할 수 있어야 한다.
- gap이 실제 낙사 gap으로 생성된 패턴에서는 formation을 해당 gap과 중복 생성하지 않는다. formation은 장애물과 낙사 gap이 없는 reserved empty corridor에서만 활성화한다.
- `freezePattern` 및 stream 반환 객체는 formation metadata와 생성된 mouse entity를 깊게 고정하여 기존 deterministic deep-equality 계약을 유지한다.
- 동일 seed의 두 stream은 pattern, formation kind/letter/cells/entity ID가 모두 같아야 한다. 연속 패턴 ID와 기존 zone gate 규칙은 유지한다.

## Acceptance Criteria

- [ ] 5종 모양과 A~Z 알파벳이 5×5 mask로 생성된다.
- [ ] 도트아트는 평균 약 20%에서만 선택되고 5종이 동일 확률이다.
- [ ] 일반 mouse entity 수가 기존보다 약 2배이며 도트아트 구간에서는 중복되지 않는다.
- [ ] formation entity가 장애물·낙사 gap·필수 행동 경로와 겹치지 않는다.
- [ ] 알파벳 선택의 5%가 DEX metadata로 변환된다.

## Validation

- `npm test -- --test-name-pattern="pattern|formation|mouse|gap"`

## Commit Message

```text
feat(game): add deterministic five-by-five mouse formations

Plan: 2026-09-23-font-cat-stats-mouse-formation
Phase: P02-mouse-formations-and-dex
Task: T01-formation-generator

- define five equal-weight dot-art masks and A-Z masks
- double ordinary mouse density in safe pattern space
- add conditional five-percent DEX metadata
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending (이번 실행에서 생성)
