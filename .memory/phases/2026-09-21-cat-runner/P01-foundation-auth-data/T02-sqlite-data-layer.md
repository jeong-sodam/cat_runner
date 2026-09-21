# Task: T02 SQLite 데이터 계층

## Status: done

## Goal

로컬 SQLite에 사용자, 진행 중인 런, 이벤트 로그, 최고 점수, 세션을 저장하는 스키마와 repository 경계를 만든다. 이후 서버 검증과 Cosmos DB 교체가 가능하도록 게임 로직이 SQL을 직접 호출하지 않게 한다.

## Decision Summary

- 현재 저장소는 SQLite이며 better-sqlite3를 사용한다.
- 사용자별 최고 점수는 1개만 유지한다.
- 진행 상태와 이벤트는 24시간 이어하기를 위해 저장한다.

## Implementation

### I01. 연결·마이그레이션·스키마

- Related Files:
  - src/db/database.js :: openDatabase(), closeDatabase(); new
  - src/db/migrate.js :: migrateDatabase(db); new

#### Details

- openDatabase(path)는 상위 data 디렉터리를 생성하고 foreign_keys=ON, journal_mode=WAL을 설정한다.
- migrateDatabase()는 idempotent CREATE TABLE IF NOT EXISTS를 사용한다.
- users:
  - id INTEGER PRIMARY KEY
  - entra_subject TEXT NOT NULL UNIQUE
  - tenant_id TEXT NOT NULL
  - email TEXT NOT NULL
  - nickname TEXT NULL
  - created_at INTEGER NOT NULL
  - updated_at INTEGER NOT NULL
- runs:
  - id TEXT PRIMARY KEY
  - user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
  - cat_id TEXT NOT NULL
  - seed TEXT NOT NULL
  - status TEXT NOT NULL CHECK(status IN ('active','completed','abandoned'))
  - score INTEGER NULL
  - distance_m REAL NULL
  - mouse_count INTEGER NULL
  - snapshot_json TEXT NULL
  - started_at INTEGER NOT NULL
  - updated_at INTEGER NOT NULL
  - expires_at INTEGER NOT NULL
  - completed_at INTEGER NULL
- run_events:
  - id INTEGER PRIMARY KEY AUTOINCREMENT
  - run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE
  - seq INTEGER NOT NULL
  - type TEXT NOT NULL
  - occurred_at_ms INTEGER NOT NULL
  - payload_json TEXT NOT NULL
  - created_at INTEGER NOT NULL
  - UNIQUE(run_id, seq)
- best_scores:
  - user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
  - score INTEGER NOT NULL
  - distance_m REAL NOT NULL
  - achieved_at INTEGER NOT NULL
- sessions:
  - sid TEXT PRIMARY KEY
  - sess TEXT NOT NULL
  - expired_at INTEGER NOT NULL
- Add indexes on runs(user_id, status), runs(expires_at), run_events(run_id, seq), best_scores(score DESC, distance_m DESC).

### I02. Repository 계약과 SQLite 구현

- Related Files:
  - src/db/repositories/user-repository.js :: createUser(), findByEntraSubject(), updateNickname(); new
  - src/db/repositories/run-repository.js :: createRun(), saveSnapshot(), appendEvents(), findResumableRun(), completeRun(); new
  - src/db/repositories/leaderboard-repository.js :: getBestScore(), upsertIfBetter(), getTopScores(); new

#### Details

- 모든 repository 함수는 plain object를 반환하며 Date 객체 대신 Unix milliseconds number를 사용한다.
- User:
  - createUser({ entraSubject, tenantId, email }) returns { id, entraSubject, tenantId, email, nickname, createdAt, updatedAt }
  - updateNickname(userId, nickname) allows duplicates and updates updatedAt.
- Run:
  - createRun({ id, userId, catId, seed, now, expiresAt }) creates active run with null score fields.
  - appendEvents(runId, events[]) validates seq uniqueness before transaction insert.
  - saveSnapshot(runId, snapshot) stores JSON and updates updatedAt.
  - findResumableRun(userId, now) returns the latest active run with expiresAt > now, otherwise null.
  - completeRun(runId, result) writes score, distanceM, mouseCount, status completed, completedAt.
- Leaderboard:
  - upsertIfBetter(userId, { score, distanceM, achievedAt }) replaces only when score is higher, or score equal and distanceM is higher.
  - getTopScores(limit=10) orders score DESC, distanceM DESC, achievedAt ASC.

### I03. SQLite express-session Store

- Related Files:
  - src/auth/sqlite-session-store.js :: class SQLiteSessionStore extends session.Store; new
  - test/db.test.js :: schema, repository, session persistence tests; new

#### Details

- Implement get(sid, cb), set(sid, session, cb), destroy(sid, cb), touch(sid, session, cb).
- Serialize session JSON into sessions.sess and calculate expired_at from cookie.expires or cookie.maxAge.
- get() deletes expired rows before returning null.
- Repository writes that affect a run and its events use a single SQLite transaction.
- Tests use an in-memory database and close it in afterEach.

## Acceptance Criteria

- [ ] Fresh SQLite database creates all five tables and indexes idempotently.
- [ ] Duplicate entra_subject and duplicate run event seq are rejected without partial writes.
- [ ] Best score replacement follows score DESC, then distance DESC, then earliest achievedAt.
- [ ] Active run lookup ignores expired runs.
- [ ] Session Store set/get/touch/destroy works across a database reopen.

## Validation

- npm test -- test/db.test.js
- node --test test/db.test.js

## Commit Message

~~~text
feat(data): add sqlite repositories and session store

Plan: 2026-09-21-cat-runner
Phase: P01-foundation-auth-data
Task: T02-sqlite-data-layer

- add sqlite schema and migrations
- add user, run, event, and leaderboard repositories
- persist express sessions in sqlite
~~~

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
