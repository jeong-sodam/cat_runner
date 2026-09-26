# Task: T03 Overlap and DEX Regression Tests

## Status: done

## Goal

겹침 제거와 DEX 확률·쿨다운 변경이 client gameplay, server manifest, renderer fallback, formation collection, DEX obstacle suppression, 기존 낙사·무적 계약을 깨뜨리지 않는지 고정된 seed 기반 회귀 테스트로 검증한다.

## Decision Summary

- ordinary route AABB overlap은 continuous route 우선으로 단일화한다.
- formation 셀의 의도된 인접 배치는 overlap cleanup의 대상이 아니다.
- DEX chance는 15%, DEX 후 cooldown은 다음 2 pattern이다.
- client/server parity는 entity ID, 상대 위치, dimensions, route metadata, formation metadata, DEX sequence까지 비교한다.

## Implementation

### I01. Client overlap and DEX invariants

- Related Files:
  - `test/game-systems.test.js` :: route merge, formation selection, DEX cooldown, collection safety tests; modify
  - `test/game-core.test.js` :: DEX/formation gameplay safety only if existing coverage needs a focused assertion; modify only if needed

#### Details

- deterministic pattern samples must include an ordinary route with both legacy guided and continuous candidates; assert every actual AABB overlap keeps the continuous candidate and removes only the non-formation legacy candidate.
- include close-but-non-overlapping candidates and different-Y candidates to prove they remain.
- assert formation cells retain their full cell count and shape metadata, including normal 5×5 forms and DEX D/E/X sequence.
- run a bounded seeded stream to verify DEX rate is statistically within a deterministic count for 15% eligibility and never appears in either of the next two pattern indices after a DEX. Avoid flaky exact counts by asserting a fixed seed’s expected indexes or a bounded count with a known sample size.
- keep assertions for DEX obstacle suppression, formation individual collection, fall damage once, invincibility, and stage-one jump safety.

### I02. Server/client parity and security regression

- Related Files:
  - `test/score-validation.test.js` :: client/server pattern parity and DEX metadata; modify
  - `test/integration.test.js` :: server manifest seeded DEX cooldown and route overlap; modify
  - `test/security-regression.test.js` :: route/formation event ownership and unknown entity/gap rejection; read-only unless parity fields require an assertion
  - `test/render.test.js` :: formation mouse fallback and overlap-safe drawing; modify only if needed

#### Details

- compare client and server patterns for multiple zones after documented scale/spacing normalization.
- compare entity IDs, relative x/y, width/height, routeKind, routeAction, routeIndex, formationId/kind/cell, formationLetter, formationSequenceIndex, `formation.isDex`, `formation.sequence`, and `obstacleSuppressed`.
- assert server manifest rejects no valid continuous-route entity event and still rejects unknown/tampered entity or gap IDs.
- do not weaken legacy local-record, fall damage, or DEX suppression assertions. Record better-sqlite3 native cleanup-only failures separately from assertion failures.

## Acceptance Criteria

- [x] overlapping ordinary guided mice are removed without changing formation cell counts.
- [x] DEX 15% and two-pattern cooldown are deterministic and client/server identical.
- [x] renderer, collection, DEX suppression, fall damage, invincibility, and security regressions remain green.
- [x] complete suite result and the environment-only native failure are documented.

## Validation

- `node test/game-systems.test.js`
- `node test/game-core.test.js`
- `node test/render.test.js`
- `node test/integration.test.js`
- `node test/security-regression.test.js`
- `node test/score-validation.test.js`
- `npm test`

## Commit Message

```text
test(game): lock mouse overlap and dex cadence invariants

Plan: 2026-09-26-mouse-overlap-dex-rate
Phase: P01-mouse-overlap-dex-rate
Task: T03-overlap-dex-regression-tests

- cover continuous route overlap cleanup and formation preservation
- protect deterministic DEX rate cooldown and server parity
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history

## Validation Results

- `node test/game-systems.test.js`: pass, 31/31.
- `node test/game-core.test.js`: pass, 14/14.
- `node test/render.test.js`: pass, 18/18.
- `node test/score-validation.test.js`: pass, 12/12.
- `node test/integration.test.js`: both route and DEX assertions pass, then exits on the existing Windows `better-sqlite3` cleanup-hook assertion.
- `node test/security-regression.test.js`: assertion passes, then exits on the same native cleanup-hook assertion.
- Elevated `npm test`: 132 total, 128 pass, 4 file-level failures (`auth`, `integration`, `run-resume`, `security-regression`), all caused by the native `better-sqlite3` `RemoveEnvironmentCleanupHook` assertion after test assertions complete.
