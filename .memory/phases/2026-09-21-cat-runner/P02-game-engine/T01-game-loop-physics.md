# Task: T01 게임 상태·입력·물리·메인 루프

## Status: done

## Goal

Canvas에서 독립적으로 실행 가능한 자동 러너의 핵심 상태와 게임 루프를 만든다. W 2단 점프, S 홀드 슬라이딩, 자동 이동, 중력, 체력, 게임 오버 상태를 deterministic하게 계산한다.

## Decision Summary

- 논리 캔버스 크기는 1600x900이며 실제 화면은 CSS로 16:9에 맞춰 스케일링한다.
- 입력은 W 점프, S 슬라이딩, P 일시정지다.
- 캐릭터는 자동으로 달리고 월드가 왼쪽으로 이동한다.
- 내부 체력은 30이며 화면 표시용 3칸은 렌더러가 변환한다.

## Implementation

### I01. 게임 상수와 상태 모델

- Related Files:
  - public/js/game/constants.js :: GAME_CONFIG, CAT_DEFINITIONS, EFFECT_TYPES; new
  - public/js/game/state.js :: createGameState(), resetRunState(), transitionGameState(); new

#### Details

- GAME_CONFIG:
  - canvasWidth=1600, canvasHeight=900, groundY=700
  - baseWorldSpeed=360 pixels/second
  - gravity=2400 pixels/second2
  - jumpVelocity=-900 pixels/second
  - maxJumps=2
  - playerWidth=90, playerHeight=110, slideHeight=60
  - maxHealth=30, collisionDamage=10
  - pixelsPerMeter=100
- CAT_DEFINITIONS keys are black, white, calico, cheese, mackerel, chaos. Each has jumpMultiplier, speedMultiplier, slideMultiplier, itemDurationMultiplier, healthMultiplier; exactly one multiplier is 1.1 and one is 0.9, all others are 1.
- createGameState({ catId, seed }) returns:
  - status: ready | running | paused | gameover
  - catId, seed, elapsedMs, distanceM, score, mouseCount, health
  - player: x, y, vy, width, height, isGrounded, jumpsUsed, isSliding
  - worldOffset, worldSpeed, zoneId
  - activeEffect: null or { type, expiresAtMs }
  - input: { leftUnused: false, jumpPressed: false, slideHeld: false }
- transitionGameState rejects invalid transitions and permits ready->running, running<->paused, running->gameover.

### I02. Input controller

- Related Files:
  - public/js/game/input-controller.js :: createInputController(canvas, onPause); new

#### Details

- Listen to window keydown/keyup and only accept lowercase w, s, p after normalization.
- W keydown creates one jumpPressed edge; holding W must not auto-repeat jumps.
- S keydown sets slideHeld=true; keyup sets false.
- P keydown calls onPause once per key press and prevents browser scrolling.
- All accepted keys call preventDefault. Return destroy() that removes listeners.
- Expose consumeJumpPress() and isSliding() so the loop reads input without owning DOM events.

### I03. Fixed-step simulation and lifecycle

- Related Files:
  - public/js/game/game-loop.js :: createGameLoop({ state, input, onStateChange, onEvent, clock }); new
  - test/game-core.test.js :: state, input, jump, slide, and lifecycle tests; new

#### Details

- requestAnimationFrame driver uses a fixed simulation step of 1/120 second and an accumulator; clamp frame delta to 50ms to avoid a tab-switch jump.
- Each simulation step:
  1. If status is not running, do not advance time or distance.
  2. Apply cat speed multiplier and difficulty speed multiplier to worldSpeed.
  3. Apply gravity to player.vy and player.y.
  4. On jumpPressed and jumpsUsed < 2, set vy=jumpVelocity*jumpMultiplier, increment jumpsUsed, emit player_jump.
  5. When player reaches groundY, clamp y, set grounded, reset jumpsUsed.
  6. Set isSliding from slideHeld only while grounded; use slideHeight and keep feet at groundY.
  7. Move worldOffset, elapsedMs, distanceM and emit distance_checkpoint every whole meter.
  8. If health <= 0, transition to gameover and emit run_gameover.
- Return start(), pause(), resume(), stop(), destroy(), getState().

## Acceptance Criteria

- [ ] W produces at most two jumps before landing, including when held.
- [ ] S changes the player hitbox only while held on the ground.
- [ ] P pauses and resumes without increasing elapsed time or distance while paused.
- [ ] Game over occurs exactly when health reaches zero.
- [ ] Simulation produces identical state for identical seed, inputs, and timestamps.

## Validation

- node --test test/game-core.test.js
- npm test

## Commit Message

~~~text
feat(game): add deterministic runner loop and player physics

Plan: 2026-09-21-cat-runner
Phase: P02-game-engine
Task: T01-game-loop-physics

- define cat stats and game state
- implement W jump, S slide, and P pause input
- add fixed-step runner physics
~~~

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
