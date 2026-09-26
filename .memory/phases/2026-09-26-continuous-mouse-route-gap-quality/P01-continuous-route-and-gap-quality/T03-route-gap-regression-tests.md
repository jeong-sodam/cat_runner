# Task: T03 쥐 루트·구멍 회귀 테스트

## Status: done

## Goal

연속 쥐 루트와 단계별 구멍 변경이 클라이언트 gameplay, 서버 검증, 렌더링, 결정론을 함께 만족하는지 최종 회귀 테스트로 고정한다.

## Decision Summary

- 테스트는 seeded generation을 사용해 무작위성 때문에 flaky하지 않아야 한다.
- 성공 조건은 단순히 쥐 수가 증가하는 것이 아니라 안전 루트의 연속성, 구멍 단계 규칙, client/server parity, 낙사 계약까지 포함한다.
- 전체 `npm test` 실패가 native addon cleanup 문제라면 assertion 실패와 구분해 기록한다.

## Implementation

### I01. Cross-module deterministic regression coverage

- Related Files:
  - `test/game-systems.test.js` :: continuous route and gap invariants; modify/new
  - `test/integration.test.js` :: client/server manifest parity; modify/new
  - `test/render.test.js` :: gap visual primitives; modify/new
  - `test/security-regression.test.js` :: forged gap/route event rejection; modify/new
  - `test/game-core.test.js` :: gap fall and safe recovery; modify only if needed

#### Details

- Add a bounded seeded scenario for `home_day`, `outside`, and `home_night` and assert:
  - the first visible route exists immediately;
  - no safe empty bridge is longer than the configured route visibility limit;
  - route entities are spaced within 34~42px except formation cells;
  - outside gaps are 140~180px at 20% eligibility and home_night gaps are 160~220px at 30% eligibility;
  - no two consecutive pattern indices contain gaps;
  - gap guidance starts approximately 1.5 player widths before the edge and ends after the landing point;
  - all gap candidates are safe for stage-two one-jump gameplay.
- Compare client `createPatternStream(seed)` output with server `createServerManifest(seed, { zoneId })` after applying the documented horizontal scale and spacing rules. Compare IDs, positions, widths, gap metadata, route actions, and formation metadata.
- Keep assertions for DEX obstacle suppression, formation cell collection, fall damage once, invincibility behavior, and unknown gap rejection.
- If the implementation adds a version bump, assert the new `PATTERN_VERSION` is used consistently by run events and server validation.

### I02. Validation and test fixture hygiene

- Related Files:
  - `test/run-resume.test.js` :: local result fixture only if pattern metadata is persisted; read-only otherwise
  - `test/app-flow.test.js` :: UI behavior only if continuous route changes affect app state; read-only otherwise
  - `package.json` :: test command; read-only unless a focused command needs a documented script

#### Details

- Do not weaken existing assertions or remove the legacy local-record compatibility tests.
- Run focused tests first, then the complete suite with `npm test`. Record environment-only failures separately from assertion failures in this Task file.
- Use fixed seeds and bounded pattern counts so tests finish quickly and retain exact failure locations.

## Acceptance Criteria

- [x] Focused client and renderer tests pass; integration/security assertions pass before the known native SQLite teardown failure.
- [x] Deterministic client/server route and gap parity is asserted.
- [x] Existing fall, formation, DEX, and legacy local-record tests remain green.
- [x] Full-suite result and the native test-runner limitation are recorded.

## Validation

- `node test/game-systems.test.js`
- `node test/game-core.test.js`
- `node test/render.test.js`
- `node test/integration.test.js`
- `node test/security-regression.test.js`
- `npm test`

## Commit Message

```text
test(game): lock continuous route and gap invariants

Plan: 2026-09-26-continuous-mouse-route-gap-quality
Phase: P01-continuous-route-and-gap-quality
Task: T03-route-gap-regression-tests

- cover continuous mouse guidance and staged gap rules
- protect client server parity and fall safety
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history

## Validation Results

- `node test/game-systems.test.js`: pass, 29/29.
- `node test/game-core.test.js`: pass, 14/14.
- `node test/render.test.js`: pass, 18/18.
- `node test/score-validation.test.js`: pass, 11/11.
- `node test/integration.test.js`: regression assertion passes, then exits on the existing Windows `better-sqlite3` cleanup-hook assertion.
- `node test/security-regression.test.js`: regression assertion passes, then exits on the same native cleanup-hook assertion.
- Elevated `npm test`: 124 total, 118 pass, 6 file-level failures (`auth`, `integration`, `leaderboard`, `run-resume`, `security-regression`, `server`), all after assertions passed and caused by the same `better-sqlite3` `RemoveEnvironmentCleanupHook` assertion. Sandboxed `npm test` additionally cannot spawn Node workers (`EPERM`).
