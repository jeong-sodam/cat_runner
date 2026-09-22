# Task: T02 다각형 충돌 및 낙사 게임플레이

## Status: done

## Goal

장애물 4종의 실제 실루엣에 가까운 다각형 피격범위를 적용하고, `outside`·`home_night`에만 결정론적으로 생성되는 140~220px 바닥 구멍을 플레이어의 낙하·피해·복귀·무적 상태와 연결한다.

## Decision Summary

- 구멍은 앞뒤 200px 안전 여유와 장애물 없는 구간을 보장하며, `outside` 약 15%, `home_night` 약 30% 빈도로 생성한다.
- 낙사 피해는 10이고 구멍 끝 바닥에 복귀한 뒤 1초 무적이다. 기존 무적 효과도 낙사 피해를 막지만 낙하 연출과 이벤트는 발생한다.

## Implementation

### I01. Gap constants and deterministic pattern data

- Related Files:
  - `public/js/game/constants.js` :: `GAME_CONFIG` — add `fallDamage`, `fallRecoveryMs`, `gapMinWidth`, `gapMaxWidth`, `gapSafeMargin`, `gapChanceOutside`, `gapChanceHomeNight`
  - `public/js/game/patterns.js` :: `PATTERN_LIBRARY`, `createPatternStream`, `isValidPattern` — add deterministic gap metadata
  - `public/js/game/world.js` :: `spawnNextPattern`, `updateWorldEntities` — materialize absolute gap IDs and prune old gaps
  - `public/js/game/state.js` :: `createGameState` — add `worldGaps`, `player.isFalling`, `player.fallGapId`, `player.fallVy`, `player.fallRecoveryUntilMs`

#### Details

- Use exact values: `fallDamage: 10`, `fallRecoveryMs: 1000`, `gapMinWidth: 140`, `gapMaxWidth: 220`, `gapSafeMargin: 200`, `gapChanceOutside: 0.15`, `gapChanceHomeNight: 0.30`.
- Every pattern-stream call must consume the same deterministic gap roll and width random values regardless of current zone so server/client manifest generation stays reproducible. A candidate gap is active only when the current zone’s chance threshold accepts the roll; `home_day` always rejects it.
- Gap definitions are plain data: `{ id, x, width, minZone: "outside" }` with absolute `x` assigned during spawn. Use a gap-safe pattern anchor whose interval has no obstacle and leaves at least 200px between the gap and the pattern edges/other entities. Gap width is inclusive of both floor edges and never exceeds 220px.
- Gap IDs must be stable as `${pattern.id}-gap-${patternIndex}` and must be retained in returned pattern data for event emission.

### I02. Gap rendering and falling state

- Related Files:
  - `public/js/render/draw-backgrounds.js` :: new `drawGap` helper — draw the dark floor opening and readable edges
  - `public/js/render/scene-renderer.js` :: `render` — draw active gaps behind entities and before the cat
  - `public/js/game/game-loop.js` :: `simulateStep` — advance fall and recover at the gap’s far edge
  - `public/js/game/collision.js` :: new gap/polygon helpers and `resolveEntityCollisions` — detect gaps and emit damage

#### Details

- A gap is presentation/world data, not a collectible entity. Draw it only when active and keep the existing background floor outside its interval.
- Add `getObstaclePolygons(entity)` returning local polygons for each variant: box body rectangle, pot body/rim polygon, fence post/rail polygons, and yarn octagonal circle approximation. Exclude shadows/highlights. Use polygon-vs-player-rectangle SAT/intersection; preserve the existing AABB helpers for mouse/grass and gap horizontal checks.
- On a grounded player whose screen-space horizontal interval overlaps an active gap, set `isFalling=true`, `fallGapId`, `fallVy=0`, clear sliding, and emit exactly one `{ type: "fall_damage", payload: { gapId } }`. Apply `GAME_CONFIG.fallDamage` unless an active invincible effect prevents it; never mutate the gap or emit repeatedly while falling.
- While falling, integrate gravity into `player.fallVy` and `player.y`; do not advance a normal jump counter. When the gap’s right edge is left of the player’s screen x, restore `player.y = groundY - player.height`, clear falling fields, and set `fallRecoveryUntilMs = elapsedMs + 1000`. Do not rewind `worldOffset` or reposition the player horizontally.
- Treat `fallRecoveryUntilMs > elapsedMs` as collision invulnerability for obstacle and fall damage, while still allowing rendering and event sequencing. If health reaches zero from a non-prevented fall, existing gameover flow emits `run_gameover`.

### I03. Client tests

- Related Files:
  - `test/game-systems.test.js` :: gap generation, polygon hitbox, fall damage/recovery cases — modify
  - `test/game-core.test.js` :: falling state does not advance jump/slide physics and recovery timing — modify
  - `test/render.test.js` :: gap drawing and item fallback assertions — modify if T01 exposes a needed contract

#### Details

- Assert same seed produces same gap IDs/widths, home day has no active gaps, outside/night use configured thresholds, widths stay 140..220, and safe margins/obstacle separation hold.
- Assert each obstacle variant’s polygon accepts its body and rejects a near-edge point outside the polygon; preserve mouse/grass AABB collection tests.
- Assert a fall emits one `fall_damage`, removes 10 health unless invincible, recovers at the gap’s far edge after 1000ms, and does not rewind world progress. Assert recovery invulnerability blocks an immediate obstacle hit.

## Acceptance Criteria

- [ ] Obstacle variants use polygon hitboxes without changing mouse/grass collection geometry.
- [ ] Deterministic gaps obey zone chance, width, margin, and no-obstacle constraints.
- [ ] Falling damages once, recovers at the gap end, and grants one second of invulnerability.

## Validation

- `npm.cmd test -- test/game-core.test.js test/game-systems.test.js test/render.test.js` — client physics, collision, gap, and rendering contracts pass.
- `npm.cmd test` with clean auth environment — full regression remains green after client gameplay changes.

## Commit Message

```text
feat(game): add polygon hazards and fall recovery

Plan: 2026-09-22-obstacle-item-fall-hazard
Phase: P01-assets-collision-fall
Task: T02-polygon-collision-fall-gameplay

- Use silhouette polygon hitboxes for obstacle variants
- Generate deterministic gaps with fall damage and recovery
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
