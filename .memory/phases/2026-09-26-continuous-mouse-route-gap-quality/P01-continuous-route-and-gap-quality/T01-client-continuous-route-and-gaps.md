# Task: T01 클라이언트 연속 쥐 루트와 단계별 구멍 생성

## Status: done

## Goal

게임 시작부터 모든 패턴 사이에 쥐 인형이 끊기지 않는 안전한 이동 가이드를 생성하고, 2단계와 3단계의 구멍 빈도·폭·간격을 결정론적으로 적용한다. 기존 obstacle-guided route와 5×5 formation을 보존하면서 빈 구간에도 일반 쥐를 연결한다.

## Decision Summary

- 일반 쥐 루트는 약 34~42px 간격, 구간당 기본 5~7개이며, 빈 구간에서는 지상 가까이 유지하고 긴 구간만 낮은 점프로 완만하게 상승한다.
- 5×5 formation은 그대로 두고 앞뒤 일반 쥐 루트를 연결한다. 모든 쥐를 반드시 먹어야 하는 구조는 아니다.
- 2단계(`outside`) 구멍은 20%, 140~180px, 1단 점프 통과 가능으로 제한한다. 3단계(`home_night`)는 30%, 160~220px이며 일부 2단 점프 구간을 허용한다.
- 같은 단계에서 구멍을 연속 생성하지 않고 최소 한 패턴을 안전 구간으로 둔다.

## Implementation

### I01. 단계별 생성 상수와 패턴 route geometry

- Related Files:
  - `public/js/game/constants.js` :: `GAME_CONFIG`; modify
  - `public/js/game/patterns.js` :: `createGuidedMouseRoute`, `addDenseMice`, `createPatternStream`, route helpers; modify
  - `public/js/game/world.js` :: `spawnNextPattern`, `resolvePatternSpacing`; modify only if inter-pattern bridge entities require world placement
  - `public/js/game/state.js` :: initial world route bookkeeping; modify only if bridge state cannot be derived from active pattern data

#### Details

- Add named configuration fields instead of inline literals:
  - `mouseRouteSpacingMin: 34`, `mouseRouteSpacingMax: 42`, `mouseRouteCount: 7`
  - `gapChanceOutside: 0.20`, `gapChanceHomeNight: 0.30`
  - `gapWidthOutsideMin: 140`, `gapWidthOutsideMax: 180`
  - `gapWidthHomeNightMin: 160`, `gapWidthHomeNightMax: 220`
  - a route lead/landing margin derived from `playerWidth` for the 1.5-character pre-gap guide
- Replace the current fixed `GUIDED_MOUSE_OFFSETS`-only behavior with a deterministic route builder that:
  1. creates the existing obstacle-specific jump/slide route;
  2. fills every obstacle-free interval and inter-pattern spacing with ground-near mice at 34~42px spacing;
  3. creates the gap route from approximately `1.5 * playerWidth` before the gap, through low point/high point/landing, and filters every candidate through obstacle and gap collision checks;
  4. keeps all ordinary route entities `collectible: true`, while leaving formation semantics unchanged;
  5. prevents duplicate route points when a connector meets an existing guided route or a formation boundary.
- Use a deterministic spacing roll from the existing seeded random stream, or a fixed midpoint when a route is generated from a pattern without a random argument. Do not use `Math.random()`.
- Track the previous pattern's final route point or generate a bridge range from the actual `startX` and previous pattern end so there is no visible empty segment after the first pattern. The first spawned pattern must also contain a route visible immediately after game start.
- Preserve `routeAction`, `routeIndex`, and `routeSeedIndex` on guided mice. Add a stable connector marker only if needed; it must be copied by the server manifest in T02.
- Ensure formation patterns still suppress obstacle spawns for DEX and that connector mice do not overlap formation cells.

### I02. Gap selection and safety rules

- Related Files:
  - `public/js/game/patterns.js` :: `createPatternStream`, gap selection state; modify
  - `public/js/game/world.js` :: spawned gap positions and pattern spacing; modify if required

#### Details

- Select the width range from `state.zoneId`: outside uses 140~180px; home_night uses 160~220px; home_day creates no gaps.
- Select occurrence from the seeded `gapRoll`: outside `< 0.20`, home_night `< 0.30`.
- Keep a `lastGapPatternIndex`/equivalent deterministic guard so a gap cannot be generated in immediately adjacent patterns. The guard must survive stream calls and reset only when a safe pattern has been emitted.
- Keep the existing gap safe margin and validate that obstacles, formation anchors, route entities, and the full gap route are outside the forbidden collision intervals. A route candidate that is not safe is omitted or regenerated deterministically; it must never be placed inside a gap or obstacle.
- Stage-two gaps must not be tied to `double-jump` patterns. Only stage-three candidates may mark a gap route as double-jump capable, and only for the selected subset of eligible patterns.

### I03. Client-level tests for generation

- Related Files:
  - `test/game-systems.test.js` :: pattern stream, route, gap, and zone tests; modify/new
  - `test/game-core.test.js` :: fall and recovery tests; modify only if route metadata changes the fixture

#### Details

- Assert from a seeded stream that the first pattern has mice, successive patterns have no route-free bridge longer than the configured maximum, and formation front/back connectors exist without replacing formation cells.
- Assert route mice do not intersect obstacles or gaps, gap routes begin before the gap and land after it, and stage-two gaps remain one-jump safe.
- Assert stage frequencies and widths stay in bounds, adjacent gaps are absent, and home_day has no gaps.
- Assert the existing gap fall event, one-time damage, recovery, and double-jump tests remain valid.

## Acceptance Criteria

- [ ] 쥐 인형이 게임 시작부터 장애물 없는 구간과 패턴 사이까지 끊기지 않고 보인다.
- [ ] 일반 루트와 구멍 루트가 장애물·구멍·formation과 겹치지 않는다.
- [ ] 2단계/3단계 구멍 빈도와 폭이 결정된 범위에 맞고, 인접 패턴 구멍이 없다.
- [ ] 기존 5×5 formation, DEX, 낙사, 최저 점프력 1 안전성이 유지된다.

## Validation

- `node test/game-systems.test.js`
- `node test/game-core.test.js`

## Commit Message

```text
feat(game): connect continuous mouse routes and staged gaps

Plan: 2026-09-26-continuous-mouse-route-gap-quality
Phase: P01-continuous-route-and-gap-quality
Task: T01-client-continuous-route-and-gaps

- keep mouse guidance continuous through safe empty space
- tune stage two and stage three gap generation
```

## Progress

- [x] 구현 완료
- [x] 검증 통과: game-systems 28/28, game-core 14/14, app-flow 20/20, render 18/18
- commit: recorded in git history
