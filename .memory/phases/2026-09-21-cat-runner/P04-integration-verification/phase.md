# Phase: P04 Integration, verification, and local run

## Tasks

| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | "done" | Integration tests, stable errors, ownership, and security regression coverage | [T01](./T01-integration-tests-errors.md) |
| T02 | "done" | Local setup documentation and final manual acceptance checklist | [T02](./T02-local-run-documentation.md) |

## Progress

- done: 2/2

## Verification

- `npm test` — 61 tests passed.
- `node --test test/integration.test.js test/security-regression.test.js` — passed.
- Local server health check on port 3301 — HTTP 200.
- `.env` and `data/*.sqlite*` are ignored.
