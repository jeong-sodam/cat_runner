# Task: T02 패턴·충돌·수집·점수

## Status: done

## Goal

검증 가능한 장애물·아이템 패턴, 집 안→집 밖→마지막 집 안 구역 전환, AABB 충돌, 쥐 인형 점수, 강아지풀 랜덤 효과, 점진적 난이도를 게임 상태에 연결한다.

## Decision Summary

- 패턴은 완전 랜덤이 아니라 검증된 패턴 목록을 seed 기반으로 섞는다.
- 점수는 mouseCount*10 + floor(distanceM)이다.
- 강아지풀은 자석·무적·점수 2배·꽝을 각각 25%로 뽑는다.
- 1000점과 2500점에서 배경 구역을 전환한다.

## Implementation

### I01. 패턴과 구역 생성기

- Related Files:
  - public/js/game/patterns.js :: ZONE_DEFINITIONS, PATTERN_LIBRARY, createPatternStream(seed); new
  - public/js/game/world.js :: spawnNextPattern(), updateWorldEntities(); new

#### Details

- ZONE_DEFINITIONS:
  - home_day: minScore 0, background living-room, difficulty 1
  - outside: minScore 1000, background alley-park, difficulty 1.2
  - home_night: minScore 2500, background dark-home, difficulty 1.5
- Each pattern has id, width, minGap, entities. Entity fields are id, type (obstacle|mouse|grass), x, y, width, height, variant, collectible.
- Pattern templates must include jump-only, slide-only, and mixed patterns. Every pattern declares a safe path and minGap >= playerWidth*1.5.
- createPatternStream(seed) uses a deterministic seeded PRNG and does not repeat the same pattern id twice in a row.
- world entities are kept in logical world coordinates; entities left of player.x - 200 are removed.
- spawnNextPattern() rejects a candidate when its minGap would overlap the previous pattern or make the safe path impossible.

### I02. Collision and effects

- Related Files:
  - public/js/game/collision.js :: getPlayerHitbox(), intersects(), resolveEntityCollisions(); new
  - public/js/game/effects.js :: rollGrassEffect(), applyEffect(), updateActiveEffect(); new

#### Details

- getPlayerHitbox() uses the normal player height unless isSliding, then uses slideHeight with feet fixed.
- Each obstacle can damage a run only once, using entity.hitByPlayer boolean. On collision emit obstacle_collision and subtract collisionDamage unless activeEffect.type is invincible.
- Mouse collection marks entity collected and emits mouse_collected with entityId and occurredAtMs. Mouse score is 10.
- Grass collection marks entity collected and uses seeded roll values 0..3 mapped equally to magnet, invincible, double_score, slow_miss.
- Positive effects expire after 5000 * cat.itemDurationMultiplier milliseconds. slow_miss always expires after 5000ms.
- A new grass collection always replaces the current active effect. magnet pulls uncollected mice within 260px toward the player each step. double_score doubles only subsequent mouse points. slow_miss multiplies world speed contribution by 0.8 for its duration.

### I03. Score and difficulty

- Related Files:
  - public/js/game/scoring.js :: calculateScore(), updateScore(), calculateDifficulty(); new
  - test/game-systems.test.js :: pattern validity, collision, effect probability, score, zone tests; new

#### Details

- calculateScore({ mouseCount, distanceM, activeEffect }) returns mouseCount*10*doubleMultiplier + floor(distanceM). Distance score is never doubled.
- calculateDifficulty(distanceM, zoneId) returns a speed multiplier that rises linearly from 1.0 to 1.5 over the first 2000m, then stays at 1.5; multiply by zone difficulty.
- Zone selection is score-based and monotonic: score >= 2500 wins over outside; score >= 1000 selects outside; otherwise home_day.
- Tests use a deterministic seed and assert every generated pattern has a safe path, no impossible gap, and stable entity ids.

## Acceptance Criteria

- [ ] The same seed yields the same pattern and grass effect sequence.
- [ ] A jump-only obstacle is avoidable by a valid one- or two-step jump and a slide-only obstacle is avoidable by S.
- [ ] Mouse, grass, obstacle collision, magnet, invincibility, double score, and slow miss emit distinct events.
- [ ] Score and zone thresholds match 1000 and 2500 exactly.
- [ ] Repeated grass replaces, rather than stacks with, the previous effect.

## Validation

- node --test test/game-systems.test.js
- npm test

## Commit Message

~~~text
feat(game): add patterns collisions collectibles and scoring

Plan: 2026-09-21-cat-runner
Phase: P02-game-engine
Task: T02-pattern-collision-scoring

- add deterministic safe pattern generation
- implement collisions and four grass outcomes
- calculate score, zones, and progressive difficulty
~~~

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
