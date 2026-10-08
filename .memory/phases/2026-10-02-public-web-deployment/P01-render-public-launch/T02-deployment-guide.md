# Task: T02 Deployment Guide

## Status: done

## Goal

Update the project documentation so the owner can connect the GitHub repository to Render and visitors can understand how to open and play the public game.

## Decision Summary

- The public deployment is a Render Free Node web service in Singapore, built from `main` and served at a Render-provided `onrender.com` URL.
- Visitors need only a browser; the game remains account-free and stores personal progress per browser.
- The free service can sleep after inactivity and its server filesystem, including SQLite data, is ephemeral. Do not describe server leaderboard/session records as durable.
- Shared rankings and custom domains remain future work.

## Implementation

### I01. Add public deployment instructions

- Related Files:
  - `README.md` :: add a deployment section near local setup and describe public usage; modify
  - `.memory/decisions/2026-10-02-public-web-deployment.md` :: source decisions; read-only
  - `render.yaml` :: source of service settings; read-only

#### Details

- **Documentation fields and facts**:
  - Hosting provider: Render.
  - Resource type: Blueprint-managed Node web service.
  - Repository: `jeong-sodam/cat_runner`.
  - Blueprint path: `/render.yaml` at repository root.
  - Branch: `main`; auto-deploy after linked CI checks pass (`checksPass`).
  - Region: Singapore; plan: Free.
  - Commands: build `npm ci`; start `npm start`; health path `/api/health`.
  - Visitor URL: Render assigns the actual `https://<service-name>.onrender.com` address after creation; do not fabricate a final URL before deployment.
- Explain the owner flow: sign in to Render, connect GitHub and authorize access to the repository, create a Blueprint using the root `render.yaml`, apply its settings, then copy the assigned HTTPS URL.
- Explain the visitor flow: open the URL in any modern browser and choose the existing local-play flow; no VS Code, Node.js, account, or download is required for visitors.
- State that per-player results and in-progress browser-local game data stay in that player's browser and do not become shared across users or devices.
- State the free-tier limits relevant to users: the app may sleep after 15 minutes without traffic, the next visit may take about a minute to start, and server-side files/database data can be lost after restart, sleep, or redeploy.
- Do not include secrets or instructions to enable legacy guest authentication.

### I02. Add remote manual acceptance steps

- Related Files:
  - `docs/manual-acceptance.md` :: add a short deployed-site checklist; modify
  - `README.md` :: keep its deployment section linked to the acceptance checklist; read/write as needed

#### Details

- Add steps to open the assigned HTTPS URL in a private/incognito window, confirm the initial game choice screen renders, start a local run, complete a run, and confirm its personal record appears in the same browser.
- Confirm a second browser profile starts with its own local records and does not see a server-shared leaderboard.
- Check `https://<service-name>.onrender.com/api/health` returns HTTP 200 JSON with `ok: true`.
- State that a first request after idle may be slow because the Free service is waking; retry once before diagnosing a deployment failure.
- Do not add or run a test suite from the documentation task.

## Acceptance Criteria

- [x] README contains owner setup and visitor instructions consistent with `render.yaml`.
- [x] Documentation clearly distinguishes per-browser personal records from server-shared data.
- [x] Free-tier sleep and ephemeral-storage limitations are visible before users rely on the service.
- [x] Manual acceptance checklist covers the public HTTPS page, health endpoint, and local record flow.
- [x] No committed service URL is invented before Render assigns it.

## Validation

- `rg -n "Render|onrender.com|api/health|local" README.md docs/manual-acceptance.md` — confirm deployment details and acceptance instructions are present.
- Review changed documentation against `render.yaml` and `.memory/decisions/2026-10-02-public-web-deployment.md` for consistency.

## Commit Message

```text
docs(deploy): explain public Render setup and limits

Plan: 2026-10-02-public-web-deployment
Phase: P01-render-public-launch
Task: T02-deployment-guide

- Document GitHub-to-Render setup and browser-only access
- Describe free-tier behavior and local score storage
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

### Validation Notes

- The required `rg -n "Render|onrender.com|api/health|local" README.md docs/manual-acceptance.md` search found the owner setup, visitor guidance, local record scope, health check, and assigned URL placeholder.
- Compared the documentation with `render.yaml` and the deployment decisions: `main`, Singapore, Free, `npm ci`, `npm start`, `/api/health`, and `checksPass` all match.
- Confirmed current Free service sleep and ephemeral filesystem behavior in [Render's Free instance documentation](https://render.com/docs/free).
- Did not run a test suite, as the task explicitly excludes it.
