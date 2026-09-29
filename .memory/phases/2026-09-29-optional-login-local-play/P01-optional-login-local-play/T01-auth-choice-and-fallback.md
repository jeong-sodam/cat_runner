# Task: T01 Auth Choice and Local Fallback

## Status: done

## Goal

Make first access usable without .env: local play is immediately selectable and login shows a development notice instead of an unfinished Entra flow. Preserve authenticated-session onboarding and do not expose configuration values.

## Decision Summary

- Local play starts at cat selection without nickname or user ID.
- Missing auth configuration, missing fetch, non-success /api/me, and network failure all use the same choice screen.
- Entra backend code remains, but the current login control never calls /auth/signin.

## Implementation

### I01. Convert the auth screen to callback-driven actions

- Related Files:
  - public/js/ui/auth-screen.js :: renderAuthScreen; modify
  - public/js/ui/auth-screen.js :: renderAuthConfigError; remove or leave unused only for compatibility

#### Details

- Remove guestMode as the gate for a playable action.
- Accept documentRef, onLocalPlay, and onLoginNotice options.
- Render an active primary button with class game-button primary auth-link, type button, text 로컬로 플레이; invoke onLocalPlay and never navigate.
- Render a secondary button with class game-button auth-link, type button, text 로그인 (개발 예정); invoke onLoginNotice and never navigate.
- Keep Korean copy and existing fitSingleLineText behavior. Missing callbacks must leave controls inert.

### I02. Route every unauthenticated bootstrap outcome to the choice screen

- Related Files:
  - public/js/app/app-controller.js :: showAuth; modify
  - public/js/app/app-controller.js :: bootstrap; modify
  - public/js/app/app-controller.js :: showAuthConfigError; remove the bootstrap call path if compatibility requires keeping the symbol
  - public/js/app/app-controller.js :: new showLoginDevelopmentNotice; new

#### Details

- showAuth passes onLocalPlay that calls showCharacterSelect({ allowResume: true }) and onLoginNotice that calls showLoginDevelopmentNotice().
- The notice is dismissible Korean UI meaning 로그인 기능은 개발 예정입니다; it must not call window.location, fetch, or /auth/signin.
- Keep authenticated true plus user behavior: assign state.user, then nickname onboarding when nickname is blank, otherwise character selection.
- For missing fetch, every non-OK response including AUTH_CONFIG_MISSING, unauthenticated OK payload, and thrown errors, call showAuth().
- Do not gate local play on guestMode; the legacy /auth/guest route may remain but is not rendered/called.

### I03. Add focused auth-entry tests

- Related Files:
  - test/app-flow.test.js :: existing auth/bootstrap tests; modify/add

#### Details

- Replace the old AUTH_CONFIG_ERROR expectation with SCREEN_NAMES.AUTH and a local-play control.
- Cover missing fetch, config-missing response, generic non-OK response, and rejected fetch.
- Dispatch local play and assert character selection with no guest/protected API call.
- Dispatch login and assert the development notice with no navigation/fetch call.
- Keep authenticated nickname onboarding coverage.

## Acceptance Criteria

- [ ] No Entra variables are required to reach local play.
- [ ] Local play enters character selection without an ID or server call.
- [ ] Login only shows a development notice.
- [ ] Existing authenticated sessions retain their current flow.
- [ ] Secrets are never rendered.

## Validation

- node --test test/app-flow.test.js

## Commit Message

    feat(auth): add configuration-independent local play entry

    Plan: 2026-09-29-optional-login-local-play
    Phase: P01-optional-login-local-play
    Task: T01-auth-choice-and-fallback

    - show local play when auth configuration is unavailable
    - keep login as a development notice

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: 4a82374
