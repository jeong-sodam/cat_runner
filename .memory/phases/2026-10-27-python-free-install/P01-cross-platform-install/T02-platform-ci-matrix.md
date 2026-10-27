# Task: T02 Cover Supported Platforms in CI

## Status: done

## Goal
Have the existing GitHub Actions workflow install dependencies with `npm ci` and run the application suite on Node.js 22 and 24 for Windows x64, Ubuntu x64, Intel macOS, and Apple Silicon macOS so the dependency change is checked on every chosen platform family and architecture.

## Decision Summary
- Preserve the existing pull request and `main` push triggers, read-only contents permission, checkout/setup-node steps, npm cache, and test commands.
- Extend the current Node-version and operating-system matrix with `macos-15` (arm64) and `macos-15-intel` (x64); keep Ubuntu for Render and Windows for local use.

## Implementation

### I01. Extend the runtime compatibility workflow matrix

- Related Files:
  - `.github/workflows/node-compatibility.yml` :: `jobs.test.strategy.matrix` — enumerate Node/platform combinations for clean dependency install and test; modify.

#### Details
- **Signatures & Types**:
  - No application signatures or types change. Workflow values are YAML strings and integer Node versions.
- **Data & Schema Fields**:
  - Matrix dimensions:
    - `node-version`: integers `22`, `24`.
    - `os`: strings `ubuntu-latest`, `windows-latest`, `macos-15`, `macos-15-intel`.
  - Expected combinations: eight jobs (each Node version on each runner label).
  - GitHub-hosted runner architecture mapping for this workflow: `macos-15` is Apple Silicon arm64; `macos-15-intel` is Intel x64. Ubuntu/Windows remain x64.
- **Execution Flow / Logic**:
  1. Precondition & Validation: Read the existing `node-compatibility.yml`; retain `pull_request`, push to `main`, `permissions.contents: read`, `actions/checkout@v7`, `actions/setup-node@v7`, `cache: npm`, and `cache-dependency-path: package-lock.json`.
  2. Core Processing: Add both macOS labels to `strategy.matrix.os` while retaining `ubuntu-latest` and `windows-latest`; do not change the matrix Node versions. Each combination must continue to run `npm ci` then `npm test`.
  3. Error & Exception Handling: Set `fail-fast: false` so one platform failure does not hide results from remaining platforms. Do not add secrets, deployment steps, Python setup, or compiler-install steps.
  4. State Transition & Return: On each pull request or push to `main`, the workflow schedules eight independent platform/version jobs; a native binding install or test failure fails the corresponding job.

### I02. Validate matrix syntax and commands
- Related Files:
  - `.github/workflows/node-compatibility.yml` :: `jobs.test.steps` — read-only validation reference for checkout, Node setup, `npm ci`, and `npm test`.

#### Details
- Verify YAML parses and matrix expansion contains all eight pairs. In CI, each pair installs the lockfile and runs the existing suite; no new test source files are added.

## Acceptance Criteria
- [x] The workflow matrix includes Node 22 and 24 on `ubuntu-latest`, `windows-latest`, `macos-15`, and `macos-15-intel` (eight combinations).
- [x] Pull request and `main` push triggers, npm cache, `npm ci`, and `npm test` are preserved.
- [x] No Python or native compiler installation is added to workflow setup; the matrix schedules `npm ci` and `npm test` for all eight combinations.

## Validation
- `npm.cmd ci` — verifies the shared lockfile on the Windows host before relying on CI.
- `npm.cmd test` — verifies the existing test suite on the Windows host.
- Matrix assertion script — confirms Node `[22, 24]`, OS `[ubuntu-latest, windows-latest, macos-15, macos-15-intel]`, and eight combinations.
- GitHub Actions `Node compatibility` workflow — configured to run on pull requests and pushes to `main`; actual remote runner results are observed when a change is pushed/opened as a pull request.

## Commit Message
```text
ci: verify SQLite install on macOS architectures

Plan: 2026-10-27-python-free-install
Phase: P01-cross-platform-install
Task: T02-platform-ci-matrix

- Add Apple Silicon and Intel macOS to the Node compatibility matrix
- Keep clean install and test checks for Linux and Windows
```

## Progress
- [x] Implementation complete
- [x] Local validation passed (`npm.cmd ci`, `npm.cmd test` 162/162, and 8-pair matrix assertion).
- Remote validation passed: GitHub Actions run [40481308278](https://github.com/jeong-sodam/cat_runner/actions/runs/40481308278) completed successfully; all eight Node/platform jobs passed.
- commit: see Git history
