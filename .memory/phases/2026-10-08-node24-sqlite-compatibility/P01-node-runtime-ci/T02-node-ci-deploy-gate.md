# Task: T02 Node CI Matrix and Render Deploy Gate

## Status: done

## Goal

Add repeatable CI coverage for both supported Node.js LTS lines on the Windows development platform and Ubuntu deployment platform, and update the pending Public Web Deployment T01 blueprint so Render deployments wait for passing checks.

## Decision Summary

- Run `npm ci` and `npm test` for the four combinations of Node.js 22/24 and `ubuntu-latest`/`windows-latest`.
- Trigger the workflow on every pull request and on pushes to `main`; grant only `contents: read` permission.
- Use `actions/checkout@v7` and `actions/setup-node@v7` with npm caching.
- Set the pending Render configuration task to use `autoDeployTrigger: checksPass`; the actual `render.yaml` edit remains in the existing Public Web Deployment T01 task.
- After this compatibility task is completed and committed, restore `.memory/current.md` to the existing Public Web Deployment P01-T01 task.

## Implementation

### I01. Add GitHub Actions Node compatibility matrix

- Related Files:
  - `.github/workflows/node-compatibility.yml` :: new workflow; new
  - `package.json` :: confirm supported engine range and `test` script; read-only
  - `package-lock.json` :: confirm root lockfile is available for npm caching and `npm ci`; read-only

#### Details

- Create one GitHub Actions workflow named `Node compatibility` with:
  - `on.pull_request` with no target-branch restriction;
  - `on.push.branches` containing only `main`;
  - top-level `permissions.contents: read`;
  - one job named `test`;
  - `strategy.fail-fast: false`;
  - a matrix with `node-version: [22, 24]` and `os: [ubuntu-latest, windows-latest]`;
  - `runs-on: ${{ matrix.os }}`;
  - `actions/checkout@v7`;
  - `actions/setup-node@v7` with `node-version: ${{ matrix.node-version }}`, `cache: npm`, and `cache-dependency-path: package-lock.json`;
  - sequential run steps `npm ci` and `npm test`.
- Do not add secrets, deployment credentials, deploy steps, or functional test files.
- All four matrix jobs must pass for the GitHub workflow run to be successful.

#### Execution Flow / Logic

1. A pull request or push to `main` starts the workflow.
2. GitHub runs the job once for each of four OS/version combinations.
3. Each job installs exactly from `package-lock.json` using `npm ci` and executes the existing full suite with `npm test`.
4. Render's `checksPass` trigger, recorded in I02, waits for these repository checks before deploying a `main` commit.

### I02. Align the pending deployment decision and task with CI-gated deployment

- Related Files:
  - `.memory/decisions/2026-10-02-public-web-deployment.md` :: D03 deployment source/update decision; modify
  - `.memory/phases/2026-10-02-public-web-deployment/P01-render-public-launch/T01-render-service-blueprint.md` :: Render blueprint specification, execution logic, and acceptance criteria; modify
  - `.memory/phases/2026-10-02-public-web-deployment/P01-render-public-launch/phase.md` :: mark the existing T01 as active when resuming; modify
  - `.memory/current.md` :: restore active plan/phase/task to the pending public deployment T01 after this plan's T02 is committed; modify

#### Details

- In the earlier Public Web Deployment decision D03, preserve automatic deployment from GitHub `main` but clarify that Render deploys only after linked CI checks pass. State that this supersedes the original commit-trigger-only behavior.
- In the existing T01 Render Blueprint task, change the required `autoDeployTrigger` literal from `commit` to `checksPass`.
- Update its execution flow and acceptance criteria to require checks to pass before Render deploys; keep the service, region, build/start commands, health route, and environment settings unchanged.
- In the old P01 phase dashboard, set T01 status to `in_progress`; T02 and T03 remain `pending`; set progress to `done: 0/3 (active: T01)`.
- Once this compatibility plan's T02 is committed, set `.memory/current.md` back to:
  - Active Plan: `./plans/2026-10-02-public-web-deployment.md`
  - Active Phase: `./phases/2026-10-02-public-web-deployment/P01-render-public-launch/phase.md`
  - Active Task: `./phases/2026-10-02-public-web-deployment/P01-render-public-launch/T01-render-service-blueprint.md`
- Its next-step text must say that `render.yaml` already exists and now needs the `checksPass` value, then revalidate the service against `package.json` and `/api/health`.
- Do not modify `render.yaml` in this task; the existing Public Web Deployment T01 owns and commits that implementation.

#### Execution Flow / Logic

1. Add and locally inspect the workflow structure, triggers, action versions, matrix, install command, and test command.
2. Run the existing full test suite locally on Node.js 24.21.0 after T01 has passed.
3. Commit the workflow and aligned memory task documents. The PR or `main` push will run the matrix; Render will not deploy until all checks pass.
4. Restore the current-task pointer to the existing Public Web Deployment T01 so its `render.yaml` change can be executed as the next memory task.

## Acceptance Criteria

- [x] The new workflow runs on all pull requests and pushes to `main`.
- [x] The matrix includes exactly Node 22 and 24 on both Ubuntu and Windows.
- [x] Each matrix job runs `npm ci` and then `npm test`.
- [x] Workflow permissions are limited to `contents: read`; there are no secrets or deployment steps.
- [x] The older Public Web Deployment decision and T01 blueprint specify Render `checksPass` behavior.
- [x] The old phase dashboard marks T01 active and `.memory/current.md` resumes that T01 after the compatibility task.
- [x] No `render.yaml` implementation change is made in this task.

## Validation

- `npm.cmd test` — full suite passes locally on Node.js 24.21.0 after T01.
- `git diff --check` — no whitespace errors.
- Inspect the committed Actions run after the PR or `main` push; all four matrix jobs must pass before the pending Render task can deploy through `checksPass`.

## Commit Message

```text
ci: test Node 22 and 24 across Windows and Ubuntu

Plan: 2026-10-08-node24-sqlite-compatibility
Phase: P01-node-runtime-ci
Task: T02-node-ci-deploy-gate

- Add pull request and main-branch Node compatibility checks
- Require passing checks before Render deploys
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

### Validation Notes

- `npm.cmd test` on Node.js 24.21.0: all 162 tests passed (sandboxed attempt hit `spawn EPERM`; rerun with the approved process-spawn permission passed).
- `git diff --check`: passed.
- Inspected workflow triggers, permissions, action versions, four matrix combinations, and sequential install/test steps.
- GitHub-hosted Node 22/24 matrix jobs can only run after the workflow is pushed; Render's `checksPass` trigger gates deployment on those checks.
