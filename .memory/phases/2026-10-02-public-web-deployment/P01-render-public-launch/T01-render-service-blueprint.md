# Task: T01 Render Service Blueprint

## Status: done

## Goal

Add a Render Blueprint at the repository root that describes the agreed free Cat Runner web service, deploys `main` commits automatically, and uses the existing health endpoint for deploy checks.

## Decision Summary

- Use Render's native Node runtime, Free web service plan, Singapore region, and GitHub `main` branch; deploy only after linked CI checks pass.
- Build with `npm ci`, start with `npm start`, and check `/api/health`.
- Set `NODE_ENV=production`; do not configure Entra credentials, guest mode, a custom domain, a persistent disk, or a shared-ranking datastore.

## Implementation

### I01. Add the Render Blueprint

- Related Files:
  - `render.yaml` :: Render service declaration; new
  - `package.json` :: confirm existing `start` script and Node.js engine requirement; read-only
  - `src/server.js` :: confirm `startServer` reads configured `PORT` and `/api/health` returns HTTP 200 JSON; read-only

#### Details

- **Blueprint schema**: Root YAML mapping with `services` as a one-element sequence. Its service mapping must contain:
  - `type`: string literal `web`
  - `name`: string `cat-runner`
  - `runtime`: string literal `node`
  - `plan`: string literal `free`
  - `region`: string literal `singapore`
  - `branch`: string literal `main`
  - `buildCommand`: string `npm ci`
  - `startCommand`: string `npm start`
  - `autoDeployTrigger`: string literal `checksPass`
  - `healthCheckPath`: string `/api/health`
  - `envVars`: one mapping with `key: NODE_ENV` and `value: production`
- Do not add a static site: `src/server.js` is required to serve the app and API.
- Do not add a database declaration or disk mount. The selected free service has ephemeral local storage, while initial gameplay and personal records are browser-local.
- Do not put secrets in the Blueprint. The current public local-play flow needs no Entra configuration or production session secret.

#### Execution Flow / Logic

1. Render checks out the linked `main` branch and runs `npm ci` from the repository root.
2. Render starts `npm start`; Express listens on Render's `PORT` environment variable through `src/config.js`.
3. Render requests `/api/health` and expects a 2xx response before treating the deployment as healthy.
4. Updates to the linked `main` branch trigger automatic deployments only after linked CI checks pass.

### I02. Validate the Blueprint against the repository

- Related Files:
  - `package.json` :: existing scripts and Node engine; read-only
  - `src/server.js` :: health path and response; read-only

#### Details

- Confirm `npm ci` is valid from the root because `package-lock.json` is present.
- Confirm the start command resolves to `node src/server.js` and the service honors Render's injected `PORT`.
- Confirm `/api/health` responds with status 200 and `{ "ok": true, "service": "cat-runner" }`.
- Keep this task limited to deployment configuration. Do not add tests or change application behavior.

## Acceptance Criteria

- [x] Root `render.yaml` declares exactly one Node web service using the selected Free plan and Singapore region.
- [x] Blueprint deploys `main` automatically with `npm ci` and `npm start` only after linked CI checks pass (`autoDeployTrigger: checksPass`).
- [x] Blueprint health check points to the existing `/api/health` route.
- [x] No secret, shared datastore, persistent disk, or custom domain is introduced.

## Validation

- `npm.cmd test` — existing project suite passes; no test files are added or changed in this task.
- Render Blueprint validation during the first Render Blueprint connection accepts the root `render.yaml`.

## Commit Message

```text
chore(deploy): add Render free service blueprint

Plan: 2026-10-02-public-web-deployment
Phase: P01-render-public-launch
Task: T01-render-service-blueprint

- Configure Singapore Node web service on Render Free
- Deploy main after checks pass and check the health endpoint
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

### Validation Notes

- Confirmed `package-lock.json` is present, `npm start` runs `node src/server.js`, and `engines.node` supports `^22 || ^24`.
- Confirmed `src/config.js` reads `PORT`, `src/server.js` listens on the configured port, and the existing health endpoint test verifies HTTP 200 with `{ "ok": true, "service": "cat-runner" }`.
- `node --version`: v24.21.0; `npm.cmd test`: 162 passed, 0 failed.
- `git diff --check`: passed. Inspected `render.yaml` for exactly one service and the agreed runtime, plan, region, branch, commands, `checksPass` trigger, health path, and `NODE_ENV` setting.
- Confirmed `checksPass` behavior in the [Render Blueprint specification](https://render.com/docs/blueprint-spec). Render account/Blueprint connection validation remains for the publish task because this repository is not connected to Render yet.
