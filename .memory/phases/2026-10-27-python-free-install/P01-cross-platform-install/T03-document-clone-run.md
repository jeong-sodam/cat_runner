# Task: T03 Document Clone and Run Setup

## Status: done

## Goal
Let a new Windows or Mac user tell from `README.md` that Node.js/npm are the only required local setup tools, Python/compiler installation is unnecessary on the supported CPU architectures with the locked prebuilt SQLite package, and which commands install and start the game.

## Decision Summary
- Keep Node.js 22 or 24 LTS as the prerequisite and keep `.env`/account setup optional for local play.
- Show Windows PowerShell commands `npm.cmd install` and `npm.cmd start`; show macOS shell commands `npm install` and `npm start`. Mention supported Windows x64, Intel Mac, and Apple Silicon Mac.

## Implementation

### I01. Clarify prerequisites and platform-specific commands

- Related Files:
  - `README.md` :: `준비물` and `로컬에서 실행하기` sections — describe prerequisites and first-run steps; modify.
  - `.memory/decisions/2026-10-27-python-free-install.md` :: D01–D04 — read-only source of confirmed platform, runtime, dependency, and documentation choices.

#### Details
- **Signatures & Types**:
  - Not applicable; documentation-only change.
- **Data & Schema Fields**:
  - Not applicable; no application data or configuration schema changes.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Preserve the README's Korean prose, local mode explanation, existing port `3000`, optional `.env` explanation, and Node.js 22/24 LTS requirement.
  2. Core Processing: In `준비물`, identify Node.js/npm as prerequisites, specify Windows x64 and Intel/Apple Silicon Mac support, and state that Python or compiler tools are not required for those supported targets when npm installs the published binary. In `로컬에서 실행하기`, label the existing PowerShell `npm.cmd install` and `npm.cmd start` commands for Windows, and add a shell example with `npm install` then `npm start` for macOS. Explain that Node.js/npm must already be installed and that local play does not require `.env` or account setup.
  3. Error & Exception Handling: Do not promise unsupported CPU architectures or claim Python is unnecessary for every possible Node/platform combination; keep the statement scoped to supported architectures and the compatible prebuilt package. Do not publish a command that deletes user data as part of setup.
  4. State Transition & Return: A reader can select the command block for their OS and proceed from an installed Node.js runtime to `http://localhost:3000` without installing Python/compiler tools or configuring an account.

### I02. Review documentation consistency
- Related Files:
  - `README.md` :: `Render에 공개 배포하기` section — read-only reference; preserve Render's Linux deployment guidance and existing `npm ci`/`npm start` commands.
  - `render.yaml` :: service `buildCommand`, `startCommand`, and `runtime` — read-only reference; do not modify.

#### Details
- Ensure the new local installation wording does not imply changes to Render deployment. Keep Windows commands in PowerShell code blocks and macOS commands in shell code blocks.

## Acceptance Criteria
- [x] README lists Node.js 22/24 LTS and npm, and clearly says Python/compiler tools are not required for the chosen Windows x64 and Intel/Apple Silicon Mac targets with the locked prebuilt binary.
- [x] README shows `npm.cmd install` and `npm.cmd start` for Windows and `npm install` and `npm start` for macOS.
- [x] README still says local game play requires neither `.env` nor account setup, and continues to explain localhost port 3000.
- [x] Render/Linux deployment instructions and configuration remain unchanged.

## Validation
- `git diff --check` — no whitespace errors in the documentation diff.
- Manually review `README.md` to confirm OS labels, commands, prerequisites, and local URL agree with `package.json` and the confirmed decisions.

## Commit Message
```text
docs: clarify Python-free local setup

Plan: 2026-10-27-python-free-install
Phase: P01-cross-platform-install
Task: T03-document-clone-run

- Document Windows and macOS install/start commands
- Clarify Node.js prerequisites and supported SQLite prebuilt targets
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`git diff --check`; manual review confirmed commands, Node.js range, local URL, and unchanged Render configuration).
- commit: see Git history
