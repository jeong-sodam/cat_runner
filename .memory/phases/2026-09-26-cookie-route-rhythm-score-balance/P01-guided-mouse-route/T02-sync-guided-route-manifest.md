# Task: T02 서버 manifest에 유도 쥐 루트 동기화

## Status: done

## Goal

클라이언트가 생성한 일반 패턴 쥐 루트와 서버 검증 manifest의 entity 목록을 동일하게 만든다. 동일 seed에서 서버가 같은 좌표·entity 순서·수집 대상을 계산하도록 패턴 버전을 올리고, 기존 점수 검증과 DEX/formation parity를 유지한다.

## Decision Summary

- 클라이언트와 서버의 쥐 route algorithm은 동일한 입력과 산술 규칙을 사용한다.
- route 변경은 패턴 manifest 계약 변경이므로 `PATTERN_VERSION`을 `cat-runner-patterns-v7`로 올린다.
- 특수 5×5 진형과 DEX entity suppression은 기존 서버 동작을 유지한다.

## Implementation

### I01. server route parity

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `PATTERN_VERSION`, `PATTERNS`, `addDenseMice`/새 route helper, `createServerManifest`; modify
  - `public/js/game/patterns.js` :: client `PATTERN_VERSION` and route exports; read-only parity reference

#### Details

- client와 같은 `GUIDED_MOUSE_MAX_COUNT = 7` 및 action별 route y/x 계산을 server manifest에 구현한다.
- server `createServerManifest(seed)`가 각 selected pattern에서 동일한 `requiredActions`, formation roll, gap filtering 순서로 entity를 만든다.
- client와 서버 모두 좌표 계산에서 동일한 `Math.round`/정수 변환 규칙을 사용해 부동소수점 차이로 entity ID가 달라지지 않게 한다.
- server entity ID format은 기존 `${pattern.id}-${patternIndex}-${entityIndex}`를 유지한다. `entityById`와 `getEntity`가 새 route entity를 모두 반환해야 한다.
- client/server의 패턴 version을 v7로 맞추고, old v6 event는 기존 테스트 정책에 따라 의도적으로 허용하지 않는다.

### I02. parity·score validation 테스트

- Related Files:
  - `test/score-validation.test.js` :: server/client manifest parity tests; modify/new
  - `test/security-regression.test.js` :: expected pattern version fixture; modify if needed

#### Details

- 동일 seed로 client pattern stream과 server manifest를 생성해 pattern id, entity type, entity id, x/y/width/height, `minZone`, formation metadata를 비교한다.
- 일반 route entity가 server manifest에 존재하고 mouse collection event로 검증되는지 확인한다.
- DEX seed에서 obstacle suppression과 letter sequence가 기존 계약과 동일한지 확인한다.
- v7 version mismatch가 안전한 validation error를 내고, 무관한 요청 오류가 내부 경로를 노출하지 않는지 유지한다.

## Acceptance Criteria

- [ ] client/server가 v7 route entity를 동일하게 생성한다.
- [ ] 동일 seed에서 route entity ID와 좌표가 일치한다.
- [ ] 일반 쥐 수집·5×5 진형·DEX 서버 검증이 통과한다.

## Validation

- `node test/score-validation.test.js`
- `node test/security-regression.test.js`

## Commit Message

```text
feat(manifest): sync guided mouse routes

Plan: 2026-09-26-cookie-route-rhythm-score-balance
Phase: P01-guided-mouse-route
Task: T02-sync-guided-route-manifest

- mirror action-guided mouse entities on the server
- bump and validate the pattern manifest version
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history
