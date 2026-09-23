# Task: T03 도트아트 렌더링과 수집

## Status: done ✅

## Goal

5×5 formation mouse entity가 일반 쥐와 같은 시각·충돌·자석 규칙으로 동작하도록 하고, shape/letter metadata가 디버깅과 테스트에서 확인 가능하도록 한다.

## Decision Summary

- 모든 도트는 ordinary collectible mouse다.
- 전체 모양 완성이나 전부 수집은 필수가 아니다.
- 자석 범위가 큰 고양이는 현재 `260 * magnetRangeMultiplier` 규칙으로 더 많이 끌어온다.

## Implementation

### I01. 렌더링 및 수집 상호작용

- Related Files:
  - `public/js/render/draw-entities.js` :: `drawMouse`; modify only if formation emphasis is needed
  - `public/js/render/scene-renderer.js` :: `getItemPresentation`, `drawEntity`; modify
  - `public/js/game/collision.js` :: mouse collection branch; modify only for formation metadata/event payload
  - `public/js/game/effects.js` :: magnet handling; verify/modify

#### Details

- formation mouse는 기존 mouse sprite/vector fallback을 재사용하고, `formationKind`/`formationCell`에 따라 별도 충돌 크기를 만들지 않는다.
- `getItemPresentation`은 formation mouse에도 기존 bob/brightness만 적용한다. entity 위치를 직접 변경하지 않는 렌더링 계약을 유지한다.
- mouse collection event payload에 formation metadata를 추가할 수 있으나 서버 event contract를 깨지 않도록 optional field로만 제공한다.
- 자석은 `entity.type === 'mouse'`를 기준으로 동작하므로 formation mouse도 자동으로 대상이 된다. collected entity는 계속 제외한다.
- DEX/일반 formation의 수집 여부와 무관하게 world cleanup이 화면 이탈을 처리하도록 한다.

### I02. 시각·상호작용 검증

- Related Files:
  - `test/render.test.js` :: formation mouse rendering; modify
  - `test/game-systems.test.js` :: formation collection/magnet; modify

#### Details

- 5×5 formation entity 전부가 mouse draw path를 거치는지 확인한다.
- formation mouse 하나를 플레이어와 겹치게 했을 때 기존과 동일하게 `mouse_collected`, mouseCount 증가, score 증가가 발생하는지 확인한다.
- magnet range 1등급과 5등급의 판정 경계가 각각 `208`과 `312` logical pixels인지 확인한다.
- 화면 이탈/수집 시 entity가 중복 수집되지 않는 기존 계약을 유지한다.

## Acceptance Criteria

- [ ] 도트아트가 일반 쥐와 같은 sprite/fallback으로 표시된다.
- [ ] 모든 도트가 개별 수집 가능하다.
- [ ] 자석 범위 차이가 formation 수집에도 적용된다.
- [ ] formation 전체 수집을 강제하는 종료 로직이 없다.

## Validation

- `npm test -- --test-name-pattern="render|mouse|magnet|collection"`

## Commit Message

```text
feat(render): support collectible mouse formation entities

Plan: 2026-09-23-font-cat-stats-mouse-formation
Phase: P02-mouse-formations-and-dex
Task: T03-formation-render-and-collision

- reuse mouse rendering and collision for dot-art cells
- keep magnet and partial collection behavior consistent
- cover formation visuals and interactions with tests
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending (이번 실행에서 생성)
