# Plan: Optional Login and Browser Local Play

## Goal

Allow a cloned Cat Runner repository to start browser-local play without editing .env, a user ID, server session, guest account, or Entra credentials. Preserve the Entra backend and existing authenticated sessions for future/backward-compatible use, while the current login UI shows only a development notice.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | done ✅ | Add configuration-independent local entry, local run persistence/resume, and regression/documentation coverage | [P01](../phases/2026-09-29-optional-login-local-play/P01-optional-login-local-play/phase.md) |

## Decision Source

- [Confirmed decisions](../decisions/2026-09-29-optional-login-local-play.md)

## Global Constraints

- .env and all ENTRA variables are optional for browser-local play.
- Local play must never create a server user, guest account, session identity, protected API run, or leaderboard record.
- Preserve Entra backend routes/configuration and honor an already-valid authenticated session.
- Missing /api/me, AUTH_CONFIG_MISSING, missing fetch, and network errors all render the normal auth-choice screen with local play available.
- Login displays a Korean development notice and never navigates to /auth/signin.
- Local results/personal records stay in browser storage; the server leaderboard remains development-only in local mode.
- Local active-run data has no userId or expiry and remains until completion or explicit 새 게임.
- Save local state at most once per second and once on pagehide; offer explicit 이어하기 / 새 게임.
- Do not add dependencies or change server score validation, Entra claim mapping, database schema, leaderboard persistence, or deployment behavior.

## Execution Order

1. T01: auth-choice callbacks and resilient bootstrap fallback.
2. T02: versioned local active-run storage without userId.
3. T03: local autosave, resume, discard, completion cleanup, and snapshot restoration.
4. T04: documentation and full regression validation.
