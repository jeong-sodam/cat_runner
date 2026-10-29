# Plan: Node 24 Runtime Alignment

## Goal

Standardize the project on Node.js 24 and make the documented clone-and-run path work on the project's supported Windows x64, Intel Mac, and Apple Silicon Mac targets with Node.js and npm, without requiring Python or C/C++ build tools. A clean installation is verified by the existing cross-platform CI workflow.

## Confirmed Decisions

- Declare and document Node.js 24 only, represented as `^24` in `package.json` and `package-lock.json`.
- Add `.nvmrc` containing `24`; do not pin a patch release.
- Do not add `engine-strict`, a `preinstall` version guard, or another local install blocker.
- Keep `better-sqlite3` at the current locked 12.11.1 release and rely on its prebuilt binaries for documented targets.
- Keep the CI operating-system matrix and test Node 24 only.
- Document how to distinguish running npm outside the repository root (`ENOENT`) from a native SQLite build-tool fallback. On supported targets, direct users to collect the npm debug log when a C++ toolchain error persists; do not instruct them to install a compiler.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Align runtime metadata, CI, and clone-and-run guidance to Node 24 and the Node/npm-only setup requirement | [P01](../phases/2026-10-29-node24-runtime-alignment/P01-node24-runtime-setup/phase.md) |

## Out of Scope

- Replacing SQLite or changing the database schema/API.
- Guaranteeing prebuilt native binaries for operating systems or CPU architectures outside the documented targets.
- Installing Node.js, npm, or Git for users.
- Adding runtime hard-failure checks or changing application behavior.
