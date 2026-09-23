# Task: T01 서버 패턴 패리티

## Status: done ✅

## Goal

서버가 동일한 seed로 일반 쥐 증가, 5×5 formation, A~Z 및 5% DEX 결과를 생성하고 클라이언트 이벤트 entity ID를 검증할 수 있도록 한다. 패턴 버전을 올려 이전 manifest와 새 manifest가 섞이지 않게 한다.

## Decision Summary

- 서버는 클라이언트와 같은 20% formation, 동일 확률 5종, 알파벳 5% DEX 규칙을 사용한다.
- DEX에는 새 장애물이 추가되지 않으며, 기존 manifest obstacle/entity 검증 계약을 유지한다.
- `PATTERN_VERSION`은 `cat-runner-patterns-v5`로 올린다.

## Implementation

### I01. 서버 패턴 생성 동기화

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `PATTERN_VERSION`, pattern definitions, `createServerManifest`; modify
  - `src/game/server-pattern-manifest.js` :: formation mask/constants helper section; add within file or import a CommonJS-compatible helper

#### Details

- CommonJS 서버 환경에서 사용할 5×5 mask table, `FORMATION_CELL_SIZE=42`, `FORMATION_CELL_STEP=34`, formation width/height, sequence gap을 클라이언트와 값까지 동일하게 정의한다.
- 클라이언트와 같은 RNG 소비 순서를 지킨다: pattern 선택 → gap roll/width → required actions → formation roll → shape/letter/DEX roll → entity metadata.
- server manifest의 generated entity에 formation metadata와 동일한 ID 순서를 부여한다. client가 전송한 mouse entity ID가 `getEntity`로 조회되어야 한다.
- DEX manifest segment는 D/E/X mouse만 포함하고 obstacle을 추가하지 않는다. `patterns`에는 `obstacleSuppressed`/formation event metadata를 기록하여 검증과 테스트가 확인할 수 있게 한다.
- 서버 manifest의 pattern advancement는 클라이언트의 DEX pause semantics와 충돌하지 않도록 DEX segment 뒤의 pattern이 동일한 다음 pattern index/seed 상태를 사용하게 한다.

### I02. 서버 validation 계약 갱신

- Related Files:
  - `src/services/run-validation-service.js` :: `PATTERN_VERSION` 소비와 `validateEventStream`; modify only where formation/version metadata is relevant
  - `test/score-validation.test.js` :: new pattern version/formation entity tests; modify

#### Details

- `run_started.payload.patternVersion`이 v5를 요구하도록 하고, v4를 새 클라이언트 run으로 허용하지 않는다.
- formation mouse는 기존 mouse_collected event와 동일하게 점수 10 또는 double_score 20을 제공한다. 완성 보너스는 추가하지 않는다.
- DEX 중 장애물 생성을 멈추는 것은 manifest 생성 규칙으로 검증하고, 기존 entity가 아닌 새로운 obstacle event를 허용하지 않는 기존 계약은 유지한다.
- 중복 entity 수집, 잘못된 formation ID, DEX에 없는 obstacle ID, 잘못된 effect roll은 기존 contractError 규칙으로 거부한다.

## Acceptance Criteria

- [ ] 같은 seed로 client/server가 pattern ID, entity ID, formation cell, DEX metadata를 일치시킨다.
- [ ] v5 pattern version이 검증되고 stale v4 stream이 거부된다.
- [ ] formation mouse 수집 점수와 중복 수집 방지가 기존 규칙과 동일하다.
- [ ] DEX manifest에는 해당 segment의 신규 obstacle이 없다.

## Validation

- `npm test -- --test-name-pattern="server|validation|manifest|pattern version|formation"`

## Commit Message

```text
feat(server): keep formation patterns deterministic with client runs

Plan: 2026-09-23-font-cat-stats-mouse-formation
Phase: P03-parity-and-verification
Task: T01-server-pattern-parity

- mirror five-by-five and DEX generation in the server manifest
- bump the pattern contract version to v5
- validate formation mouse events without completion bonuses
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending (이번 실행에서 생성)
