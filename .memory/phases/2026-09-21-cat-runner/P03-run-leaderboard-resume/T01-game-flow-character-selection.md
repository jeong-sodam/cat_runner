# Task: T01 로그인 플로우와 캐릭터 선택

## Status: done

## Goal

인증 상태에 따라 로그인·닉네임 설정·캐릭터 선택·게임 화면을 전환하고, 매 게임 시작 전에 6종 고양이와 능력치를 보여준다.

## Decision Summary

- 게임 시작 전 로그인은 필수다.
- 닉네임은 첫 로그인 때 설정해야 하며 중복을 허용한다.
- 캐릭터는 계정에 저장하지 않고 매 게임 시작 전에 선택한다.

## Implementation

### I01. 앱 상태와 인증 화면

- Related Files:
  - public/js/app/main.js :: bootstrapApp(); new
  - public/js/app/app-controller.js :: createAppController(); new
  - public/js/ui/auth-screen.js :: renderAuthScreen(), renderAuthConfigError(); new

#### Details

- bootstrapApp() fetches GET /api/me and routes:
  - unauthenticated -> auth screen with sign-in link /auth/signin
  - authenticated without nickname -> nickname screen
  - authenticated with nickname -> character selection
- API error AUTH_CONFIG_MISSING renders Korean setup instructions without exposing client secret.
- App controller owns current screen values auth, nickname, character-select, game, pause, result, leaderboard.
- DOM user data is inserted with textContent, never innerHTML interpolation.

### I02. 닉네임 온보딩

- Related Files:
  - public/js/ui/nickname-screen.js :: createNicknameScreen(onSaved); new
  - public/styles.css :: auth and nickname screens; modify

#### Details

- Form has one text input and submit button.
- Submit PATCH /api/me/nickname with { nickname }.
- Empty trimmed value shows inline error; duplicate value is accepted.
- On success, store returned user in controller and route to character-select.
- Display full email only where the authenticated account summary requires it; use textContent.

### I03. 캐릭터 선택 화면

- Related Files:
  - public/js/ui/character-select.js :: createCharacterSelect(onStart); new
  - public/js/ui/cat-card.js :: renderCatCard(catDefinition, selected); new

#### Details

- Render exactly black, white, calico, cheese, mackerel, chaos cards.
- Each card shows coat, one advantage, one weakness, and effective multiplier values.
- Default selection is black on each new run; selection is not persisted to the user profile.
- Start button is disabled until a card is selected and calls onStart({ catId }).
- Character data is imported from the same shared constants used by the game engine; do not duplicate stat mappings.

## Acceptance Criteria

- [x] Unauthenticated users cannot reach character selection or game state.
- [x] Missing Entra configuration produces a setup message, not a blank screen.
- [x] Nickname setup is required once and duplicate nicknames work.
- [x] Every new run starts with a selectable cat and defaults to black without saving the previous choice.

## Validation

- node --test test/app-flow.test.js
- npm test
- Manual with configured Entra account: sign in, set nickname, select each of six cats, start a run.

## Commit Message

~~~text
feat(ui): add authenticated start flow and cat selection

Plan: 2026-09-21-cat-runner
Phase: P03-run-leaderboard-resume
Task: T01-game-flow-character-selection

- gate game start behind auth and nickname onboarding
- add six-cat selection screen with shared stats
- connect start screen to game controller
~~~

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
