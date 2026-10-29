# Task: T01 Runtime Version Metadata

## Status: done

## Goal

Set the repository's declared and CI-tested Node.js runtime to Node 24, matching the current development environment and the confirmed support decision.

## Decision Summary

- Use `24` in `.nvmrc` and `^24` in the package engine declaration. Keep installation non-blocking on other Node versions; do not add `engine-strict` or a preinstall guard.
- Preserve `better-sqlite3` 12.11.1, all other dependency resolutions, and the existing four operating-system CI targets. Change the CI Node matrix from 22 and 24 to 24 only.

## Implementation

### I01. Align package runtime metadata and version-manager hint

- Related Files:
  - `package.json` :: root `engines.node` — declares the supported Node runtime; modify.
  - `package-lock.json` :: `packages[""].engines.node` — mirrors the root engine metadata; modify through npm lockfile generation.
  - `.nvmrc` :: file contents — tells nvm-compatible tools to select the Node 24 major line; new.

#### Details

- **Signatures & Types**:
  - `package.json`: `engines.node: string`, exact value `"^24"`.
  - `package-lock.json`: `packages[""].engines.node: string`, exact value `"^24"`.
  - `.nvmrc`: UTF-8 text file with one line, exact content `24` followed by a newline.
- **Data & Schema Fields**:
  - No application models or database schemas change.
  - Keep the dependency declaration `better-sqlite3: "^12.11.1"` and its resolved lockfile version unchanged.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Confirm current root `package.json` uses `"^22 || ^24"`, and the package lock has the matching root engine declaration.
  2. Core Processing: Change only `engines.node` in `package.json` to `"^24"`; generate the package-lock metadata with `npm.cmd install --package-lock-only --ignore-scripts`; create `.nvmrc` with `24`.
  3. Error & Exception Handling: If lockfile generation changes dependency versions, integrity values, or unrelated package records, restore those unrelated changes and update only the root engine metadata. Do not set `engine-strict`, add install scripts, or force a local failure on other Node versions.
  4. State Transition & Return: Both manifests declare Node 24, version-manager users can select the 24 line, and dependency resolutions remain unchanged.

### I02. Restrict the existing CI runtime matrix to Node 24

- Related Files:
  - `.github/workflows/node-compatibility.yml` :: `jobs.test.strategy.matrix.node-version` — selects Node versions for clean install and the existing test suite; modify.

#### Details

- Set `node-version` to `[24]`.
- Preserve the operating-system list exactly: `[ubuntu-latest, windows-latest, macos-15, macos-15-intel]`.
- Preserve `actions/checkout@v7`, `actions/setup-node@v7`, npm caching, `npm ci`, `npm test`, trigger branches, and permissions.
- Do not add Python, Visual Studio, C++ build tools, or compiler setup steps to CI. The clean install matrix must exercise the locked SQLite prebuilt package on the documented OS/architecture targets.

## Acceptance Criteria

- [ ] `package.json` and the root package-lock entry both declare `engines.node` as `^24`.
- [ ] `.nvmrc` contains only `24`.
- [ ] The CI matrix tests Node 24 on all four existing operating-system targets, with the `npm ci` and `npm test` steps intact.
- [ ] The change adds no dependency, install hook, or strict local runtime guard.
- [ ] Dependency versions and integrity hashes in `package-lock.json` remain unchanged.

## Validation

- `node -p "require('./package.json').engines.node"` — prints `^24`.
- `npm.cmd pkg get engines.node` — reports `^24`.
- `npm.cmd ci` — installs from the lockfile on the current Windows x64 Node 24 environment without Python or C++ tools.
- `npm.cmd test` — the existing suite passes on Node 24.
- GitHub Actions `Node compatibility` workflow — clean install and suite pass on Node 24 across the preserved four OS/architecture targets.
- `git diff --check` — no whitespace errors.

## Commit Message

```text
chore(runtime): standardize on Node 24

Plan: 2026-10-29-node24-runtime-alignment
Phase: P01-node24-runtime-setup
Task: T01-runtime-version-metadata

- Declare Node 24 and add an nvm version hint
- Run the existing cross-platform CI matrix on Node 24
```

## Progress

- [x] Implementation complete
- [x] Validation passed locally on Node v24.20.0: package engine checks, clean `npm.cmd ci`, SQLite smoke query, `npm.cmd test` (163 passed), and `git diff --check`.
- GitHub Actions multi-platform run: configured for Node 24; not triggered from this local commit.
- commit: pending
