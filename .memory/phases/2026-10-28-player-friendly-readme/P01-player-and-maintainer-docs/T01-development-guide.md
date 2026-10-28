# Task: T01 Development Guide

## Status: done

## Goal
Create `docs/development.md` as the single entry point for maintainers by preserving the README's Entra and Render setup material and consolidating the existing manual acceptance checklist there, so the player README can remove operational detail without losing it.

## Decision Summary
- Keep the player README short and link to `docs/development.md` for Entra, deployment, testing, and manual acceptance details.
- Preserve the current local setup model and all technical values and commands when relocating guidance. Do not change application behavior or deployment configuration.

## Implementation

### I01. Consolidate Entra, guest API, deployment, test, and manual acceptance information

- Related Files:
  - `docs/development.md` :: maintainer guide — new; contain the moved operational material; new.
  - `README.md` :: `선택 사항: Microsoft Entra ID 백엔드`, `Render에 공개 배포하기`, and `수동 확인` sections — read-only source while doing this task; modify only in T02.
  - `docs/manual-acceptance.md` :: full acceptance checklist — read-only source for consolidation; delete only after its checklist is fully transferred into the new guide.
  - `render.yaml` :: service runtime and build/start/health-check settings — read-only source of deployment facts.
  - `.env.example` :: environment variable names and example values — read-only source of Entra configuration facts.

#### Details
- **Signatures & Types**:
  - Not applicable; documentation-only change.
- **Data & Schema Fields**:
  - Preserve the documented environment variables exactly: `PORT`, `DATABASE_PATH`, `SESSION_SECRET`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_AUTHORITY`, `ENTRA_REDIRECT_URI`, and `ENABLE_GUEST_MODE`.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Read the current README Entra, guest API, Render, and manual verification sections; read all of `docs/manual-acceptance.md`; verify deployment facts against `render.yaml` before writing. This guide is for developers/maintainers; avoid implying that login is currently available in the game UI.
  2. Core Processing: Create a Korean `docs/development.md` with sections for optional Entra backend configuration, legacy guest API mode (including its development-only limits), Render deployment (Blueprint, `npm ci`, `npm start`, `/api/health`, and dynamic HTTPS URL), local/test commands (`node --test test/integration.test.js test/security-regression.test.js`, `npm.cmd test`), and the full existing manual acceptance checklist. Keep the checklist scenarios and URLs intact. Transfer the README's user-facing explanations of local records/reset and local `.env` test configuration here. Preserve the data-reset command only in a clearly labeled destructive maintenance subsection and explain exactly which SQLite files it deletes.
  3. Error & Exception Handling: Do not invent a fixed Render URL or claim server-side persistence for browser-local records. Keep any warning about temporary Render storage and free-instance behavior factual as currently documented. Do not place secrets in repository examples beyond placeholders already used by `.env.example`.
  4. State Transition & Return: Once every checklist item in `docs/manual-acceptance.md` and every technical instruction from the named README sections exists in `docs/development.md`, replace `docs/manual-acceptance.md` with a short pointer to the new guide so existing README links remain valid for this commit. T02 removes that temporary pointer together with the old README links.

### I02. Check repository references after consolidating the checklist

- Related Files:
  - `README.md` :: current links to `docs/manual-acceptance.md` — read-only during T01, references are replaced in T02.
  - `docs/development.md` :: links/anchors for the moved guide — modify.

#### Details
- Confirm there are no remaining repository links targeting the deleted checklist after T02. The final README should contain one maintainer-guide link to `docs/development.md` and should not link to the removed path.

## Acceptance Criteria
- [x] `docs/development.md` preserves the Entra/guest configuration, Render deployment, test commands, and all cases from the old manual acceptance checklist.
- [x] Operational guidance preserves exact commands, variable names, endpoint paths, and configuration facts from the existing files.
- [x] The manual checklist exists in full only in `docs/development.md`; `docs/manual-acceptance.md` is only a temporary pointer until T02 removes it.
- [x] No application source, tests, dependency manifest, or deployment configuration is changed.

## Validation
- `git diff --check` — no whitespace errors in the documentation changes.
- Manually compare the new development guide against the README's moved sections, `docs/manual-acceptance.md`, `.env.example`, and `render.yaml`; verify all checklist scenarios and operational commands are retained.
- `rg -n "docs/manual-acceptance|docs/development" README.md docs` — after T02, confirm only valid development-guide references remain and no stale manual-acceptance link remains.

## Commit Message
```text
docs: consolidate maintainer setup guide

Plan: 2026-10-28-player-friendly-readme
Phase: P01-player-and-maintainer-docs
Task: T01-development-guide

- Move Entra, Render, and test guidance into docs/development.md
- Consolidate the manual acceptance checklist with maintainer docs
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`git diff --check`; verified all 56 acceptance items were transferred; checked the existing README anchors resolve through the compatibility pointer and confirmed deployment facts against `render.yaml`).
- commit: pending
