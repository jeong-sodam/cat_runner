# Task: T02 Player README

## Status: done

## Goal
Replace the long, maintainer-heavy `README.md` with a concise Korean guide that lets a player clone, install, start, and understand the local game on supported Windows and Mac systems.

## Decision Summary
- Primary audience: people cloning the repository to play locally. Keep quick start, gameplay controls, objective, scoring, effects, and short cat differences; move maintainer details to `docs/development.md`.
- Supported quick-start targets: Windows x64 PowerShell and Intel/Apple Silicon macOS Terminal, using Node.js 22 or 24 LTS and the OS-specific npm commands. Local play needs no `.env`, account, or login setup.

## Implementation

### I01. Write the player-first quick-start README

- Related Files:
  - `README.md` :: entire document — replace with concise Korean player guide; modify.
  - `package.json` :: `engines`, `scripts` — read-only source for supported Node versions and start command.
  - `docs/development.md` :: maintainer guide — read-only target for the single short documentation link.
  - `docs/manual-acceptance.md` :: temporary pointer left by T01 for old README links — delete after replacing the README.

#### Details
- **Signatures & Types**:
  - Not applicable; documentation-only change.
- **Data & Schema Fields**:
  - Keep the repository URL exactly `https://github.com/jeong-sodam/cat_runner.git`.
  - Keep the local URL exactly `http://localhost:3000`.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Confirm the Node engine range in `package.json` is `^22 || ^24` and the start script is `node src/server.js`. Preserve that the supported install targets are Windows x64, Intel Mac, and Apple Silicon Mac. Link to `docs/development.md` (created by T01).
  2. Core Processing: Replace README contents with Korean, player-oriented sections in this order: game one-sentence introduction; prerequisites (Node.js 22 or 24 LTS/npm, supported platforms, Python/compiler tools not required on those targets); clone-and-run quick start; local play expectations (`.env`, account, login not needed; open localhost); controls/objective; concise scoring/effects summary; compact cat-difference table; one short link to `docs/development.md`. Include command blocks exactly as follows:
     - Windows PowerShell: `git clone https://github.com/jeong-sodam/cat_runner.git`, `cd cat_runner`, `npm.cmd install`, `npm.cmd start`.
     - macOS Terminal: same clone and `cd` lines, then `npm install`, `npm start`.
     - State that the server runs at `http://localhost:3000`.
     - Controls: `W` jump (can jump again while airborne if available); hold `S` to slide; `P` pause/resume. Objective: avoid obstacles and collect mouse toys to keep the run going and build score.
     - Scoring summary: mouse toy 10 points each; distance 1 point per metre; active double-score effect doubles mouse points, not distance points. Mention the grass item can grant magnet, invincibility, double score, or slow-miss effects.
     - Cat table: include all six selectable cats `검정`, `하양`, `삼색`, `치즈`, `고등어`, `카오스`; summarize only key advantage/weakness exactly from `public/js/game/constants.js` (`advantage`, `weakness`) so details agree with the selection cards. Do not copy the full five-stat ratings table.
  3. Error & Exception Handling: Avoid instructions to create `.env`, credentials, or accounts for local play. Do not include the destructive SQLite reset command, Entra/Azure setup, deployment procedures, API details, test procedures, or acceptance checklist in the player README. Do not promise Python/compiler-free installation outside the named supported targets.
  4. State Transition & Return: A new player can follow one OS-labeled command block from clone to start, reach localhost, and find controls and a concise explanation of what to collect and how cat choices differ.

### I02. Review README length and link integrity

- Related Files:
  - `README.md` :: complete player guide — modify.
  - `docs/development.md` :: linked guide destination — read-only.
  - `docs/manual-acceptance.md` :: obsolete temporary pointer — delete.

#### Details
- Keep the final README to at most 70 lines, excluding no sections. Use short headings and avoid duplicating development-guide material. Confirm all command blocks and internal links are valid.

## Acceptance Criteria
- [x] README is no more than 70 lines and is written in clear Korean for players.
- [x] Windows and macOS clone/install/start command blocks are correct and OS-labeled.
- [x] README states the Node.js prerequisite, supported target platforms, and scoped Python/compiler note.
- [x] README says no `.env`, account, or login is needed for local play and identifies `http://localhost:3000`.
- [x] Controls, objective, score rules, grass effects, and all six cats' short advantages/weaknesses are included accurately.
- [x] Maintainer/deployment/testing/acceptance details are linked through `docs/development.md` rather than repeated in README.

## Validation
- `git diff --check` — no whitespace errors in the documentation changes.
- Manually verify commands against `package.json`, cat advantage/weakness labels against `public/js/game/constants.js`, score/effect statements against `public/js/game/scoring.js` and `public/js/game/effects.js`, and link existence at `docs/development.md`.
- `rg -n "docs/manual-acceptance|docs/development" README.md docs` — no README link to deleted manual checklist; development guide destination exists.

## Commit Message
```text
docs: simplify README for local players

Plan: 2026-10-28-player-friendly-readme
Phase: P01-player-and-maintainer-docs
Task: T02-player-readme

- Add concise Windows and macOS clone-and-play steps
- Summarize controls, scoring, effects, and cat choices
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`git diff --check`; README is 56 lines; confirmed OS commands and link destination; checked Node and gameplay facts against source; confirmed no README or repository links target the removed `docs/manual-acceptance.md`).
- commit: recorded in Git history with this Task's commit
