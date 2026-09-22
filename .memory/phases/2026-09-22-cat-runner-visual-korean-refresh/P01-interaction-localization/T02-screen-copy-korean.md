# Task: T02 전체 화면 한국어 문구 전환

## Status: done

## Goal

로그인/게스트 진입부터 닉네임, 고양이 선택, 이어하기, 결과, 순위표와 오류 안내까지 모든 앱 자체 문구를 명확한 한국어로 표기한다. 이메일 주소와 W/S/P 조작 표기는 데이터 또는 키 이름이므로 번역하지 않는다.

## Decision Summary

- 한국어 범위는 모든 사용자 화면과 HUD다.
- 문체는 귀여운 감탄사보다 `재시작`, `점수`, `일시정지` 같은 간결한 기본 UI 문체를 사용한다.

## Implementation

### I01. 정적 페이지와 화면 컴포넌트 문구 교체

- Related Files:
  - `public/index.html` :: title, shell/canvas aria labels, initial loading copy; modify
  - `public/js/ui/auth-screen.js` :: `renderAuthScreen`, `renderAuthConfigError`, `renderLoadingScreen`; modify
  - `public/js/ui/nickname-screen.js` :: `createNicknameScreen`; modify
  - `public/js/ui/character-select.js` :: `createCharacterSelect`; modify
  - `public/js/ui/cat-card.js` :: `formatMultiplier`, `renderCatCard`; modify
  - `public/js/ui/result-screen.js` :: `createResultScreen`; modify
  - `public/js/ui/leaderboard.js` :: `createLeaderboardPanel`; modify
  - `public/js/ui/error-banner.js` and `public/js/ui/settings-panel.js`; modify

#### Details

- **Execution Flow / Logic**:
  1. Replace all hard-coded English player text. Canonical terms: `고양이 러너`, `Microsoft Entra ID로 로그인`, `게스트로 플레이`, `캐릭터 선택`, `점수`, `거리`, `쥐 인형`, `순위표`, `다시 시도`, `소리 설정`, `음소거`, `배경 음악`, `효과음`.
  2. Result view: `달리기 완료`, `개인 최고 기록!`, `기록이 저장되었습니다.`, `저장 재시도`, `캐릭터 선택`, `순위표`; retain saved/rank branches.
  3. Leaderboard: `순위표`, `상위 10개 개인 최고 기록`, headers `순위/고양이 이름/이메일/점수/거리`, Korean retry/load error/back actions. Continue using `textContent` for rows.
  4. Keep routes, APIs, validation, email display, W/S/P labels, and environment variable names unchanged. `formatMultiplier(1)` returns `기본` and other numeric bonuses stay intact.

### I02. 앱 동적 안내와 회귀 테스트

- Related Files:
  - `public/js/app/app-controller.js` :: `showReconnectState`, `showResumePrompt`, `completeGameover`; modify
  - `test/app-flow.test.js` :: Korean copy assertions; modify

#### Details

- **Execution Flow / Logic**:
  1. Translate reconnect, interrupted-run recovery, submit-failure and local-result fallback messages. Preserve existing retry/error flow without exposing new raw English errors.
  2. Preserve `SCREEN_NAMES`, callbacks, API URLs, and guest auth behavior.
  3. Update copy assertions and add Korean leaderboard/local-result assertions without weakening six-cat, guest route, full-email, or XSS-safe textContent checks.

## Acceptance Criteria

- [ ] Every hard-coded player-facing app string in the listed files is Korean, except W/S/P, emails, URLs, and required environment-variable names.
- [ ] Guest, nickname, selection, result retry, leaderboard and recovery behavior is unchanged.
- [ ] Email and XSS-safety tests still pass.

## Validation

- `npm.cmd test -- test/app-flow.test.js test/auth.test.js test/security-regression.test.js` — flow, auth and security tests pass.
- `npm.cmd test` — complete serial Node test suite passes.

## Commit Message

```text
feat(ui): translate cat runner screens to Korean

Plan: 2026-09-22-cat-runner-visual-korean-refresh
Phase: P01-interaction-localization
Task: T02-screen-copy-korean

- Localize authentication, character, results, and leaderboard screens
- Preserve guest, leaderboard, and recovery flows with Korean feedback
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
