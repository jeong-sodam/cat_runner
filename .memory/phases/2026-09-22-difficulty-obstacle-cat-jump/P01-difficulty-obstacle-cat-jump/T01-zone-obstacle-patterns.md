# Task: T01 zone별 장애물 밀도 및 복합 패턴

## Status: done

## Goal

`home_day`에서는 기존 장애물 수를 유지하고 `outside`·`home_night`에서 기존 패턴을 `2/2/3` 장애물로 확장하며, outside부터 6개의 복합 패턴을 시드 기반으로 선택할 수 있게 한다.

## Decision Summary

- 기존 패턴은 `home_day: 1/1/2`, `outside·home_night: 2/2/3` 장애물 수를 사용한다.
- 복합 패턴은 `outside`와 `home_night`에서만 활성화하고, 모든 위치·variant·순서는 `PATTERN_LIBRARY`에 명시한다.
- 복합 패턴의 장애물 시작 x 간격은 `100~140px`이며, 기존 gap anchor와 200px 안전 여유를 침범하지 않는다.

## Implementation

### I01. Zone-aware pattern schema and deterministic selection

- Related Files:
  - `public/js/game/patterns.js` :: `PATTERN_LIBRARY`, `isValidPattern`, `createPatternStream` — modify
  - `public/js/game/world.js` :: `spawnNextPattern`, `updateWorldEntities` — read-only unless active entity filtering requires a small pass-through change
  - `public/js/game/constants.js` :: `GAME_CONFIG` — read-only; do not change speed, damage, or gap constants

#### Details

- Add a client pattern version constant `PATTERN_VERSION = "cat-runner-patterns-v3"`.
- Extend pattern records with:
  - `minZone: "home_day" | "outside" | "home_night" | undefined`
  - `requiredActions: Array<"jump" | "slide">` for composite patterns
  - existing `width`, `minGap`, `safePath`, `gapAnchor`, `entities`
- Extend obstacle entity records with optional `minZone: "outside"`. Base entities must remain in their original order so existing IDs stay stable; add extra outside-only obstacles after the existing entities.
- `createPatternStream.next(zoneId)` must:
  1. Filter pattern candidates by `minZone` and the existing no-adjacent-repeat rule.
  2. Consume the same random values in the same order for every zone: candidate selection, gap roll, gap width, then grass effect rolls from the complete source pattern.
  3. Map original entity indices to IDs before filtering zone-inactive entities, so `home_day` base entity IDs do not shift.
  4. Return `requiredActions` and only the entities active for the requested zone.
- `home_day` must never return a composite pattern. `outside` and `home_night` may return all six composites; `home_night` also includes outside-only extra obstacles in base patterns.

#### Exact pattern additions

Add these six patterns with `width: 1600`, `minGap: 300`, `gapAnchor: { x: 1100 }`, `minZone: "outside"`, and three obstacles at x `300`, `430`, `560`:

| Pattern id | requiredActions | x300 | x430 | x560 |
| :--- | :--- | :--- | :--- | :--- |
| `combo-jump-slide-jump` | `jump, slide, jump` | box `90x80` at y620 | fence `140x40` at y560 | pot `90x80` at y620 |
| `combo-slide-jump-slide` | `slide, jump, slide` | fence `140x40` at y560 | box `90x80` at y620 | yarn `130x40` at y560 |
| `combo-jump-jump-slide` | `jump, jump, slide` | pot `90x80` at y620 | box `90x80` at y620 | fence `140x40` at y560 |
| `combo-slide-slide-jump` | `slide, slide, jump` | fence `140x40` at y560 | yarn `130x40` at y560 | box `90x80` at y620 |
| `combo-jump-slide-slide` | `jump, slide, slide` | pot `90x80` at y620 | fence `140x40` at y560 | yarn `130x40` at y560 |
| `combo-slide-jump-jump` | `slide, jump, jump` | yarn `130x40` at y560 | box `90x80` at y620 | pot `90x80` at y620 |

- Add one outside-only ground obstacle to each existing pattern after its current entities:
  - `jump-basic`: pot at `{ x: 180, y: 620, width: 90, height: 80 }`
  - `slide-basic`: box at `{ x: 140, y: 620, width: 90, height: 80 }`
  - `mixed-safe`: box at `{ x: 120, y: 620, width: 90, height: 80 }`
- These additions produce `2/2/3` obstacles only outside/night while keeping home-day base entity IDs and collection geometry unchanged.

### I02. Client pattern tests

- Related Files:
  - `test/game-systems.test.js` :: pattern stream and world tests — modify

#### Details

- Assert same seed and same zone produce identical pattern IDs, required action arrays, entity IDs, and active obstacle counts.
- Assert `home_day` never selects a `combo-*` pattern and base pattern obstacle counts remain `1/1/2`.
- Assert outside/night base patterns contain `2/2/3` obstacles and composite patterns contain exactly three obstacles with the declared `requiredActions`.
- Assert composite obstacle starts differ by 100~140px, all entities remain at least 200px from the gap anchor, and no adjacent pattern repeats.
- Preserve existing gap determinism, collection AABB, and world pruning assertions.

## Acceptance Criteria

- [ ] Home-day obstacle counts remain `1/1/2`; outside/night base counts become `2/2/3`.
- [ ] Six composite patterns are deterministic, outside-gated, and use only existing obstacle variants.
- [ ] Pattern IDs and random consumption remain stable across identical seed and zone inputs.

## Validation

- `npm.cmd test -- test/game-systems.test.js` — pattern gating, counts, spacing, deterministic selection, and existing collision contracts pass.

## Commit Message

```text
feat(game): add zone-based obstacle density patterns

Plan: 2026-09-22-difficulty-obstacle-cat-jump
Phase: P01-difficulty-obstacle-cat-jump
Task: T01-zone-obstacle-patterns

- Increase obstacle density from outside onward
- Add six deterministic jump and slide composite patterns
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
