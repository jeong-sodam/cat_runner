# Task: T03 서버 패턴 매니페스트 parity 및 버전 검증

## Status: done

## Goal

클라이언트의 v3 zone-aware pattern stream과 서버 authoritative manifest가 같은 seed에서 같은 패턴·장애물 ID·크기를 생성하도록 맞추고, 실행 시작 이벤트가 올바른 pattern version을 사용하도록 검증한다.

## Decision Summary

- 패턴 버전을 `cat-runner-patterns-v3`로 올린다.
- 서버는 클라이언트와 같은 패턴 선택·zone gating·random 소비 순서를 구현하되, 점수·피해·수집 계약은 변경하지 않는다.
- 서버는 outside/night 활성 후보를 모두 manifest에 보관하고 `getEntity`와 `getGap` API를 유지·확장한다.

## Implementation

### I01. Client/server manifest synchronization

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `PATTERN_VERSION`, `PATTERNS`, `createServerManifest` — modify
  - `public/js/game/patterns.js` :: `PATTERN_VERSION` — consume/export from T01
  - `public/js/sync/run-sync.js` :: `startRun` — include version in `run_started` payload

#### Details

- Set both sides to `cat-runner-patterns-v3`.
- Mirror every base extra obstacle and all six composite pattern records from T01 exactly: IDs, widths, min gaps, gap anchor, `minZone`, `requiredActions`, entity order, x/y/width/height/variant.
- Server PRNG consumption order must be: candidate selection, gap roll, gap width, grass effect rolls. Zone gating must not consume or skip random values.
- Preserve base pattern entity IDs by appending outside-only entities after the existing source entities. Server pattern records may contain all manifest entities, but `getEntity` and `getGap` must return stable records by ID.
- Add/retain `gaps`, `gapById`, and `getGap(gapId)`; gap records contain `{ id, patternId, patternIndex, x, width, minZone }` with absolute x.
- `run-sync.startRun` must create `run_started.payload.patternVersion` from the shared client constant.

### I02. Server validation and parity tests

- Related Files:
  - `src/game/event-contract.js` :: `EVENT_TYPES` — preserve `fall_damage` and existing event types; modify only if v3 contract requires it
  - `src/services/run-validation-service.js` :: `validateEventStream` — validate pattern version when present; preserve existing fall/entity validation
  - `test/score-validation.test.js` :: manifest parity and v3 fixture tests — modify
  - `test/security-regression.test.js` :: version mismatch/unknown pattern event response — modify if needed
  - `test/run-resume.test.js` :: run-start payload compatibility — modify only if exact payload assertions require it

#### Details

- Assert same seed and outside zone produce matching client/server pattern IDs, entity IDs, entity dimensions, composite action metadata, and gap widths.
- Assert `home_day` excludes composite patterns while outside/night accept them.
- Assert mismatched non-empty `patternVersion` is rejected with `PATTERN_VERSION_INVALID`; absent version remains backward-compatible because the server contract currently validates it only when present.
- Preserve fall event validation: unknown/repeated/malformed gap IDs remain invalid, fake client damage fields remain ignored, and invincibility remains authoritative.
- Do not change ownership, score calculation, collision damage, item effect rolls, or run completion ordering.

## Acceptance Criteria

- [ ] Client/server v3 manifests agree for identical seeds and zones.
- [ ] Real client run-start events carry `patternVersion: cat-runner-patterns-v3`.
- [ ] Existing scoring, security, ownership, fall validation, and resume tests remain green.

## Validation

- `npm.cmd test -- test/score-validation.test.js test/security-regression.test.js test/game-systems.test.js` — server parity, version, security, and client pattern contracts pass.
- `$env:ENABLE_GUEST_MODE='false'; $env:ENTRA_CLIENT_ID=''; $env:ENTRA_CLIENT_SECRET=''; $env:ENTRA_TENANT_AUTHORITY=''; $env:ENTRA_REDIRECT_URI=''; npm.cmd test` — complete serial suite; document any pre-existing native test-runner cleanup abort separately.

## Commit Message

```text
feat(server): mirror zone-aware obstacle pattern v3

Plan: 2026-09-22-difficulty-obstacle-cat-jump
Phase: P01-difficulty-obstacle-cat-jump
Task: T03-server-pattern-parity

- Mirror zone-gated composite patterns on the server
- Version client run events for authoritative pattern validation
```

## Progress

- [x] 구현 완료
- [x] 검증 통과: score validation 6개, security regression 3개, game systems 11개
- [x] 전체 suite: 74개 통과, `run-resume.test.js`의 기존 native cleanup abort 기록
- commit: pending
