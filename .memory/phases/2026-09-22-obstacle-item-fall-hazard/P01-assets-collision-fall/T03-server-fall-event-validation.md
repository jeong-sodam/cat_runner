# Task: T03 서버 낙사 이벤트 및 회귀 검증

## Status: done

## Goal

클라이언트와 동일한 시드·gap ID 규칙을 서버 매니페스트에 반영하고, `fall_damage` 이벤트의 매니페스트 존재·중복·순서·무적 효과를 서버 점수/체력 재생성에 연결한다.

## Decision Summary

- `fall_damage` payload는 `{ gapId }`만 허용한다. 서버는 전체 물리 재생 없이 알려진 gap의 존재, 중복, 이벤트 순서와 피해량 계산만 검증한다.
- 클라이언트와 서버의 패턴 버전을 함께 올려 오래된 gap 없는 이벤트 스트림과 새 클라이언트의 불일치를 구분한다.

## Implementation

### I01. Server deterministic gap manifest

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `PATTERN_VERSION`, `PATTERNS`, `createServerManifest` — mirror client gap constants, random consumption, gap records, and lookup
  - `test/score-validation.test.js` :: manifest/gap fixture helpers — modify

#### Details

- Bump `PATTERN_VERSION` to `cat-runner-patterns-v2`.
- Mirror the client’s gap rules and deterministic roll/width generation exactly. The server manifest must expose `gaps`, `gapById`, and `getGap(gapId)` while preserving `entities`/`getEntity` APIs.
- Each gap record contains `{ id, patternId, patternIndex, x, width, minZone }`; IDs and widths for a given seed must equal the client stream.
- Do not change obstacle, mouse, grass entity IDs or their logical dimensions. Existing event streams without gaps remain valid under v2 fixtures only when their `run_started.payload.patternVersion` matches.

### I02. Event contract and authoritative replay

- Related Files:
  - `src/game/event-contract.js` :: `EVENT_TYPES` — add `fall_damage`
  - `src/services/run-validation-service.js` :: `validateEventStream` — validate and apply fall events
  - `test/score-validation.test.js` :: valid/tampered fall streams — modify
  - `test/security-regression.test.js` :: invalid/unknown/repeated gap event response — modify

#### Details

- Add `fall_damage` to `EVENT_TYPES`; the generic contract still requires contiguous sequence, non-decreasing time, and object payload.
- In replay, maintain `usedGaps = new Set()` separately from `collected` entities. For `fall_damage`, require a non-empty string `payload.gapId`, resolve it with `manifest.getGap`, reject unknown or repeated IDs with stable `SCORE_EVENT_INVALID` reasons, then add it to `usedGaps`.
- Apply `COLLISION_DAMAGE` (10) unless `activeEffect.type === "invincible"`; do not trust client damage, prevented, position, width, or health fields. The event is valid even when damage is prevented, matching obstacle collision behavior.
- Preserve lethal ordering: if fall damage reduces health to zero, only the final `run_gameover` may follow. Existing mouse, grass, obstacle, distance, score, and ownership validation must remain unchanged.
- Validate `run_started.payload.patternVersion` against `PATTERN_VERSION` when present; update fixtures to send v2.

### I03. Server regression coverage

- Assert a valid gap event reduces health by 10, invincible gap events reduce no health, duplicate/unknown/missing/string-invalid gap IDs are rejected, fake `damage` fields are ignored, and lethal fall events require a final `run_gameover`.
- Assert same seed produces stable gap IDs and widths and existing entity IDs remain stable.
- Run the complete serial suite with a clean authentication process so `.env` guest/Entra values do not alter auth configuration tests.

## Acceptance Criteria

- [ ] Client/server v2 manifests agree on gap IDs and widths for the same seed.
- [ ] `fall_damage` is validated server-side without trusting client damage or position fields.
- [ ] Existing event, score, security, and ownership tests remain green.

## Validation

- `npm.cmd test -- test/score-validation.test.js test/security-regression.test.js test/game-systems.test.js` — server/client deterministic and security contracts pass.
- `$env:ENABLE_GUEST_MODE='false'; $env:ENTRA_CLIENT_ID=''; $env:ENTRA_CLIENT_SECRET=''; $env:ENTRA_TENANT_AUTHORITY=''; $env:ENTRA_REDIRECT_URI=''; npm.cmd test` — complete serial suite passes.

## Commit Message

```text
feat(server): validate deterministic fall damage events

Plan: 2026-09-22-obstacle-item-fall-hazard
Phase: P01-assets-collision-fall
Task: T03-server-fall-event-validation

- Mirror deterministic gap manifests on client and server
- Validate fall damage events without trusting client damage values
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
