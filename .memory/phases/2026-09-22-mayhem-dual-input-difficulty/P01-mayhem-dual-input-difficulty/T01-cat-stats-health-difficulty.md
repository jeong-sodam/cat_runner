# Task: T01 고양이 능력치·체력·난이도 모델

## Status: done

## Goal

기존 5종 고양이 배율을 1~5 등급의 9종 능력치로 정리하고, 모든 고양이가 고정 역할형 프리셋을 갖도록 만든다. 기본 체력은 5칸 단위로 바꾸고 능력치에 따라 4~6칸을 사용하며, 장애물·낙사 피해는 1칸으로 통일한다. 모든 zone의 시작 속도와 거리 난이도 상한도 결정값에 맞게 조정한다.

## Decision Summary

- 능력치 키는 `jump`, `speed`, `slide`, `itemDuration`, `health`, `magnetRange`, `score`, `fallResistance`, `invincibleDuration` 9개다.
- 등급은 1~5이며 등급 3은 1.0 배율, 등급마다 약 10%씩 선형 증감한다. 체력 최대치는 `4 + round((healthRating - 1) / 2)`로 4~6칸을 만든다.
- 모든 고양이의 등급 총합은 비슷하게 유지하고, 고정 강점 2개·약점 1개를 둔다. `chaos`의 내부 ID와 한국어 label은 유지하며 `englishName: "Mayhem"`만 추가한다.
- `calculateDifficulty`는 시작 1.1, 2000m에서 1.65가 되며 zone 배율은 기존 zone 차이를 유지한다. `GAME_CONFIG`의 collision/fall damage는 1이다.

## Implementation

### I01. 클라이언트 능력치 스키마와 역할형 프리셋

- Related Files:
  - `public/js/game/constants.js` :: `GAME_CONFIG`, `CAT_DEFINITIONS`, 새 `CAT_STAT_KEYS`/등급 변환 상수; modify
  - `public/js/game/state.js` :: `createGameState`; modify
  - `src/services/run-validation-service.js` :: `CAT_STATS`, `MAX_HEALTH`, `COLLISION_DAMAGE`; modify

#### Details

- `CAT_DEFINITIONS[catId]`는 기존 호환 필드(`jumpMultiplier`, `speedMultiplier`, `slideMultiplier`, `itemDurationMultiplier`, `healthMultiplier`)를 유지하고, 다음 필드를 추가한다.
  - `englishName: string` — 현재는 `chaos`에만 `Mayhem`; 나머지는 기존 ID 기반 영문명
  - `statRatings: { jump, speed, slide, itemDuration, health, magnetRange, score, fallResistance, invincibleDuration }` — 각 값은 정수 1~5
  - `magnetRangeMultiplier`, `scoreMultiplier`, `fallResistanceMultiplier`, `invincibleDurationMultiplier`
- 등급→배율은 `1: 0.8`, `2: 0.9`, `3: 1.0`, `4: 1.1`, `5: 1.2`로 고정한다. 기존 캐릭터의 기존 강점·약점 방향은 보존한다.
- 프리셋 등급은 다음 원칙을 만족해야 한다: black는 speed/magnetRange 강점·health 약점, white는 jump/invincibleDuration 강점·slide 약점, calico는 health/fallResistance 강점·speed 약점, cheese는 itemDuration/score 강점·jump 약점, mackerel은 slide/fallResistance 강점·itemDuration 약점, chaos/Mayhem은 speed/score 강점·jump 약점. 총합은 고양이 간 1점 이내로 맞춘다.
- `GAME_CONFIG.maxHealth`는 5, `collisionDamage`와 `fallDamage`는 1로 둔다. `createGameState`는 `cat.statRatings.health`로 최대 체력을 계산해 `state.health`와 `state.maxHealth`를 초기화한다. 기존 snapshot 복원 시 `maxHealth`가 없으면 현재 catId로 재계산한다.
- 서버 `CAT_STATS`는 동일한 9종 등급/배율을 보유하고, 검증 시 `run.catId`의 `maxHealth`와 기본 damage를 5칸 규칙으로 계산할 수 있어야 한다. 서버의 기존 30 health 가정은 제거한다.

### I02. 속도·점수·피격 계산 계약

- Related Files:
  - `public/js/game/scoring.js` :: `calculateDifficulty`, `calculateScore`, `updateScore`; modify
  - `public/js/game/game-loop.js` :: `simulateStep`; read/modify only where speed and lethal health transition use new fields
  - `public/js/game/collision.js` :: `startPlayerFall`, `resolveEntityCollisions`; modify damage/resistance hooks
  - `public/js/game/effects.js` :: `applyEffect`, `updateActiveEffect`; modify multiplier hooks

#### Details

- `calculateDifficulty(distanceM, zoneId)`의 기본 거리 배율은 `1.1 + min(2000, max(0, distanceM)) / 2000 * 0.55`, 최대 1.65로 계산한다. 반환값에는 기존 `ZONE_DEFINITIONS`의 zone 배율을 곱한다.
- `calculateScore`는 기존 mouse/distance 계산을 유지하되 cat의 `scoreMultiplier`를 받아 일반 달리기 점수에 적용할 수 있도록 확장한다. osu 배율은 T03에서 별도로 적용하므로 이 Task에서는 rhythm 필드를 요구하지 않는다.
- magnet effect의 260px 고정 범위를 `260 * cat.magnetRangeMultiplier`로 바꾸고, invincible positive effect 지속시간을 `5000 * itemDurationMultiplier * invincibleDurationMultiplier`로 계산한다. 일반 item duration과 slow miss 규칙은 보존한다.
- 장애물·낙사 피해는 항상 1칸에서 시작하고 `fallResistanceMultiplier`는 낙사 피해에만 적용한다. 피해는 정수 칸으로 내림하지 말고, 등급 3 기준 1칸을 보장하는 범위에서 최소 1칸으로 clamp한다. 무적 및 fall recovery의 피해 방지 동작은 보존한다.
- `state.maxHealth`를 기준으로 HUD·lethal transition이 동작하게 하고, health가 0이 되면 기존 `run_gameover` 흐름을 유지한다.

### I03. 단위·회귀 테스트

- Related Files:
  - `test/game-core.test.js` :: state lifecycle/health assertions; modify
  - `test/game-systems.test.js` :: difficulty, score, effect, collision assertions; modify
  - `test/score-validation.test.js` :: server health/damage fixtures; modify only where old 30/10 assumptions exist

#### Details

- 6개 고양이가 모두 9개 등급을 가지며 등급이 1~5인지, 총합 차이가 1 이내인지, 지정한 강점·약점이 맞는지 검증한다.
- 시작 난이도 `calculateDifficulty(0, "home_day") === 1.1`, 기본 최대 `calculateDifficulty(2000, "home_day") === 1.65` 및 zone 배율을 검증한다.
- 고양이별 최대 체력이 등급 1/3/5에서 4/5/6으로 매핑되고, 장애물·낙사 1회 피격이 health를 1만큼 줄이는지 검증한다.
- magnet 범위, invincible duration, score multiplier가 해당 고양이 능력치에 따라 달라지고 기존 효과·무적 회귀가 유지되는지 검증한다.

## Acceptance Criteria

- [ ] 모든 고양이가 총합이 비슷한 9종 1~5 등급 프리셋과 고정 강점·약점을 가진다.
- [ ] 체력은 고양이별 4~6칸이고 일반 장애물·낙사 피해는 1칸이다.
- [ ] 시작 난이도와 2000m 상한이 1.1/1.65이며 기존 zone 배율·게임 루프 계약이 유지된다.
- [ ] magnet, score, fall resistance, invincible duration 신규 수치가 실제 게임 계산에 사용된다.

## Validation

- `npm.cmd test -- test/game-core.test.js test/game-systems.test.js test/score-validation.test.js`

## Commit Message

```text
feat(game): add nine-stat cat difficulty model

Plan: 2026-09-22-mayhem-dual-input-difficulty
Phase: P01-mayhem-dual-input-difficulty
Task: T01-cat-stats-health-difficulty

- Add balanced nine-stat cat presets and five-heart health
- Raise baseline and distance difficulty across zones
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

## Execution Record

- Implementation complete
- Validation passed: `npm.cmd test -- test/game-core.test.js test/game-systems.test.js test/score-validation.test.js`
- Commit: pending
