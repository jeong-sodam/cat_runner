# Task: T02 Node/npm-Only Install Documentation

## Status: done

## Goal

Make a new player able to identify the required Node 24 runtime, clone and run the game from the repository root with npm, and understand C++/ENOENT installation errors without being told to install Python or compiler tools.

## Decision Summary

- Document Node.js 24 and npm on the existing supported targets: Windows x64, Intel macOS, and Apple Silicon macOS. Keep the existing platform-specific `npm.cmd` / `npm` commands.
- Explain that the project uses a locked prebuilt SQLite binary on those targets; when a C++ build-tool error persists on Node 24, collect the full npm debug log for diagnosis rather than installing a toolchain.

## Implementation

### I01. Update the player quick start and troubleshooting guidance

- Related Files:
  - `README.md` :: `준비물`, `설치하고 실행하기`, and a concise troubleshooting subsection — player-facing prerequisites, commands, and error guidance; modify.

#### Details

- **Signatures & Types**:
  - No code signatures or data types change.
- **Data & Schema Fields**:
  - No application data, API, or database fields change.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Preserve the current Korean player-oriented sections and the supported OS/architecture scope.
  2. Core Processing: Change the prerequisite from Node 22 or 24 to Node.js 24 and npm. Keep Windows x64 and Intel/Apple Silicon Mac as documented targets. Preserve clone instructions and the `cd cat_runner` step before npm commands. Label the Windows command block for both PowerShell and Git Bash because the captured failure used Git Bash; use `npm.cmd install` / `npm.cmd start` there. Retain `npm install` / `npm start` for macOS. State clearly that Python and C/C++ build tools are not required for these targets.
  3. Error & Exception Handling: Add short guidance that `ENOENT` mentioning `package.json` usually means npm was run outside the cloned repository root; tell the reader to enter `cat_runner` first. State that a C++ build-tool error on a documented target with Node 24 is unexpected for the locked prebuilt SQLite package; ask them to retain/share the full npm debug log and report `node --version` plus OS/CPU architecture. Do not recommend installing Python, Visual Studio, or C++ tools as the normal fix. Do not promise support for unlisted architectures.
  4. State Transition & Return: A beginner can follow the quick start, verify Node 24, and gather actionable diagnostics while only installing the runtime and package manager.

### I02. Align the developer setup guide

- Related Files:
  - `docs/development.md` :: `로컬 개발` — developer runtime prerequisite and local install/start commands; modify.

#### Details

- Replace the Node 22-or-24 prerequisite with Node.js 24 and npm.
- Preserve the distinction that Windows PowerShell uses `npm.cmd`, while macOS/Linux shells use `npm`.
- State that the documented targets install the locked prebuilt SQLite package without a Python or C/C++ toolchain.
- Keep existing local development, test, authentication, deployment, and destructive-maintenance instructions intact.
- Do not change application code, dependency versions, or database configuration in this documentation task.

## Acceptance Criteria

- [ ] README and developer guide consistently say Node.js 24 and npm.
- [ ] README retains `cd cat_runner` before installation and the correct OS-specific npm commands.
- [ ] README identifies the Windows command block as usable in both PowerShell and Git Bash.
- [ ] The supported target scope remains Windows x64, Intel macOS, and Apple Silicon macOS.
- [ ] Both documents state that Python/C++ build tools are unnecessary on documented targets.
- [ ] README gives concise next steps for `ENOENT` caused by running outside the repository and for a persistent C++ toolchain error, without telling users to install compilers.
- [ ] Existing unrelated README and developer-guide sections remain intact.

## Validation

- `rg -n "Node.js 24|Python|C/C\+\+|ENOENT|디버그 로그|cd cat_runner" README.md docs/development.md` — confirms the runtime, prerequisites, and troubleshooting guidance are present.
- `git diff --check` — no whitespace errors.
- Manual review of the README command blocks — Windows uses `npm.cmd`; macOS uses `npm`; both enter `cat_runner` first.

## Commit Message

```text
docs(setup): clarify Node 24 install requirements

Plan: 2026-10-29-node24-runtime-alignment
Phase: P01-node24-runtime-setup
Task: T02-install-documentation

- Document Node 24 and the Node/npm-only setup path
- Explain repository-root and native SQLite install errors
```

## Progress

- [x] Implementation complete
- [x] Validation passed: documentation search, `git diff --check`, and manual review of the Windows PowerShell/Git Bash and macOS command blocks.
- commit: pending
