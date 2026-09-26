# Task: T01 UI 쉘 viewport 높이 적용

## Status: done

## Goal

게임 화면은 기존 16:9 캔버스 레터박스를 유지하고, 로그인·닉네임·캐릭터 선택·결과·개인 기록·순위표 등 UI 화면만 브라우저의 가용 높이에 맞춰 한 화면을 사용하도록 screen 상태와 CSS 경계를 분리한다.

## Decision Summary

- UI shell height는 외부 여백을 제외한 `100dvh` 기반이다.
- 실제 게임 캔버스는 16:9를 유지한다.
- UI 화면에서 세로 overflow scroll을 허용하지 않는다.

## Implementation

### I01. 화면 상태를 game shell에 반영

- Related Files:
  - `public/js/app/app-controller.js` :: `setScreen(screen)` 및 controller initialization; modify

#### Details

- `gameShell`에 현재 화면을 나타내는 `data-screen` 또는 `ui-screen` class를 갱신한다.
- `setScreen(screen)`는 기존 `screenRoot.dataset.screen` 갱신과 hidden 처리 순서를 유지하면서 `gameShell.dataset.screen = screen`을 설정한다.
- `screen === "game"`일 때만 `ui-screen`을 제거하고, auth/nickname/character-select/result/personal-records/leaderboard/loading/auth-config-error는 `ui-screen`을 부여한다. pause overlay는 게임 16:9 내부 overlay로 유지한다.
- game shell 또는 screen root가 없는 test double에서도 기존 화면 전환이 throw하지 않도록 guard를 유지한다.

### I02. UI/game 레이아웃 CSS 분리

- Related Files:
  - `public/styles.css` :: `#game-shell`, `#screen-root`, flow/wide card layout; modify

#### Details

- 기본 game shell의 `width: min(100%, 1280px)`, `aspect-ratio: 16 / 9`, internal overflow hidden을 보존한다.
- `#game-shell.ui-screen`은 `height: min(calc(100vh - 16px), 900px)`를 fallback으로 두고 `height: min(calc(100dvh - 16px), 900px)`를 override로 적용한다. `aspect-ratio: auto`, `max-height: calc(100dvh - 16px)`로 viewport를 넘지 않게 한다.
- UI 상태의 `#screen-root`는 `overflow: hidden`, `min-height: 0`, compact padding을 사용한다. 카드 내부 scroll을 새로 만들지 않는다.
- `.flow-card`/`.wide-card`의 max-height와 padding은 UI shell에 맞추고 `overflow-y: auto`를 제거하거나 T02 축소 규칙과 함께 `overflow: hidden`으로 맞춘다.

## Acceptance Criteria

- [ ] 게임 화면은 16:9 레터박스와 기존 캔버스 좌표를 유지한다.
- [ ] 비게임 UI 화면은 viewport를 넘지 않고 scrollbar가 생기지 않는다.
- [ ] setScreen이 실제 앱과 DOM fixture 양쪽에서 shell 상태를 안전하게 갱신한다.

## Validation

- `node --test --test-concurrency=1 test/app-flow.test.js test/font-layout.test.js`
- 브라우저 1280x720, 768x1024, 320x640에서 UI 화면의 scrollHeight가 clientHeight 이내인지 확인

## Commit Message

```text
fix(ui): fit non-game screens to viewport height

Plan: 2026-09-26-air-jump-slide-hitbox-ui-fit
Phase: P03-responsive-ui-no-scroll
Task: T01-ui-shell-viewport-fit

- Separate 16:9 game shell from responsive UI shell
- Prevent viewport overflow on menu screens
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`--test-isolation=none` 사용)
- commit: pending
