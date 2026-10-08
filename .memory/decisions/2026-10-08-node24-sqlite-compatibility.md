# Decisions: Node 24 SQLite Compatibility

- Date: 2026-10-08
- Status: Confirmed

## D01. SQLite binding version
- **Chosen**: Upgrade `better-sqlite3` from `^11.10.0` to `^13.0.3` and regenerate `package-lock.json`.
- **Rationale**: Version 13 is the first N-API-based major release, intended to work across Node.js major versions without the old V8 ABI-specific native binding. The application currently uses the common `Database`, `pragma`, `prepare`, and `transaction` APIs. Existing database schema and application behavior stay unchanged; the existing suite will verify the upgrade.

## D02. Supported Node.js versions
- **Chosen**: Set `engines.node` to `^22 || ^24` and document Node.js 22 and 24 as supported. Node 20 and odd-numbered Node 23 are outside the supported range.
- **Rationale**: `better-sqlite3` 13.0.3 requires Node.js 22 or later. Node 24.21.0 is Render's current default for new services, and a bounded range prevents future major-version drift.

## D03. Runtime compatibility CI
- **Chosen**: Add a GitHub Actions matrix for Node.js 22 and 24 on both `ubuntu-latest` and `windows-latest`; run `npm ci` followed by `npm test` for each matrix entry. Run on pull requests and pushes to `main`.
- **Rationale**: Ubuntu covers Render's Linux runtime, and Windows covers the development environment where the cleanup assertion was reproduced. Testing both supported Node majors checks the declared lower bound as well as the deployment target.

## D04. Render auto-deploy behavior
- **Chosen**: Change the Render Blueprint to `autoDeployTrigger: checksPass`.
- **Rationale**: Deployments should wait until the Node 22/24 compatibility checks pass, avoiding automatic publication of commits that fail the new CI matrix. This supersedes the earlier `commit` auto-deploy choice.

## D05. Documentation and database migration
- **Chosen**: Update the README's local Node.js prerequisite to Node 22 or 24. Do not change database schema or add a data migration.
- **Rationale**: The code uses standard `better-sqlite3` operations and the compatibility change is confined to the native binding/runtime support. The existing schema and migration tests cover application data behavior.

## D06. Execution order
- **Chosen**: Plan and execute this compatibility work as a separate prerequisite plan, then resume the active Public Web Deployment T01 task.
- **Rationale**: The active deployment task was scoped to configuration only, while Node compatibility changes affect dependency metadata, lockfile, documentation, and CI.
