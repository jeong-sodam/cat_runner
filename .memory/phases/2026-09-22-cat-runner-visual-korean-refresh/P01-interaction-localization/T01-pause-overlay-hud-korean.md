# Task: T01 일시정지 오버레이 및 HUD 한국어 안정화

## Status: done

## Goal

새 게임 시작 직후 `pause-overlay`가 절대로 표시되지 않고, 사용자가 일시정지한 경우에만 보이게 한다. 플레이 화면의 점수·거리·체력·효과·일시정지 조작 문구를 한국어로 보여 준다.

## Decision Summary

- CSS의 `.pause-overlay { display: grid; }`가 브라우저의 기본 `[hidden] { display: none; }`를 덮는 문제를 명시적인 숨김 규칙으로 해결한다.
- W/S/P 키 표기는 유지하고, HUD와 일시정지 UI는 깔끔한 기본 한국어 문체를 쓴다.

## Implementation

### I01. 숨김 상태와 일시정지 접근성 고정

- Related Files:
  - `public/styles.css` :: `#game-shell [hidden]`, `.pause-overlay`, `.pause-card`; modify
  - `public/js/ui/pause-controller.js` :: `createPauseController`, `sync`, `mount`; modify
  - `test/audio-pause.test.js` :: pause-controller mount regression test; modify

#### Details

- **Signatures & Types**:
  ```javascript
  function createPauseController(gameLoop, audioManager, options = {})
  // returns { mount, togglePause, sync, destroy }
  ```
- **Execution Flow / Logic**:
  1. Add a scoped CSS rule equivalent to `#game-shell [hidden] { display: none !important; }`; it must win over every component layout class without affecting unrelated page content.
  2. Keep `overlay.hidden = !isPaused()` as the single source of visibility in `sync()`, called immediately after both overlay and pause button are appended.
  3. Synchronize button text/labels: running `Ⅱ 일시정지` / `게임 일시정지`; paused `▶ 계속` / `게임 계속`.
  4. Preserve transitions and audio: running → paused stops music; paused → running starts music; restart stops loop/music then invokes `options.onRestart`.
  5. Extend fake-DOM coverage to mount the controller and assert `hidden` is true on mount, false after pause, true after resume; retain audio assertions.

### I02. HUD 한국어 레이블과 효과 표시 정리

- Related Files:
  - `public/js/render/draw-hud.js` :: `drawHud`; modify
  - `test/render.test.js` :: HUD assertions; modify

#### Details

- **Data & Schema Fields**:
  - `EFFECT_LABELS`: immutable mapping: `magnet → 자석`, `invincible → 무적`, `double_score → 점수 2배`, `slow_miss → 꽝`.
  - Existing state remains unchanged: `score: number`, `distanceM: number`, `health: number`, `activeEffect: { type: string, expiresAtMs: number } | null`, `elapsedMs: number`.
- **Execution Flow / Logic**:
  1. Render `점수 {score}`, `거리 {floor(distanceM)}m`, and effect remaining time `{remaining}초`.
  2. Use label mapping but safely render an unknown future id unchanged.
  3. Keep the three-heart calculation, game state immutability, and returned `pauseButton` hit-area shape unchanged.
  4. Update expectations to Korean and assert `magnet` renders `자석`.

## Acceptance Criteria

- [ ] Freshly mounted pause UI has `hidden === true`, and the overlay is not visually displayed while the loop status is `running`.
- [ ] Pausing/resuming toggles both state and visibility correctly without regressing audio events.
- [ ] HUD uses Korean labels while preserving heart behavior and pause hit area.

## Validation

- `npm.cmd test -- test/audio-pause.test.js test/render.test.js` — affected tests pass.
- `npm.cmd test` — complete serial Node test suite passes.

## Commit Message

```text
fix(ui): stabilize pause overlay and localize HUD

Plan: 2026-09-22-cat-runner-visual-korean-refresh
Phase: P01-interaction-localization
Task: T01-pause-overlay-hud-korean

- Ensure hidden game overlays never override their hidden state
- Translate pause controls and gameplay HUD labels to Korean
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
