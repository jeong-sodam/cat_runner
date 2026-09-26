# Task: T01 Continuous Route Overlap Cleanup

## Status: done

## Goal

일반 루트 생성 시 기존 guided mouse와 새 continuous mouse가 실제 사각형으로 겹치면 continuous mouse를 남기고 기존 guided mouse를 제거한다. formationId가 있는 formation 셀과 단순히 가까울 뿐 AABB가 겹치지 않는 안내 쥐는 보존하며, client/server 결과의 entity 순서와 metadata를 일치시킨다.

## Decision Summary

- 일반 루트만 정리하고 5×5 formation 내부 셀은 건드리지 않는다.
- 중복 판정은 실제 사각형 AABB 교집합만 사용한다. strict overlap 조건은 `first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y`로 통일한다.
- continuous route additions가 우선이며, 겹치는 기존 non-formation mouse를 삭제한다.

## Implementation

### I01. Client route merge priority

- Related Files:
  - `public/js/game/patterns.js` :: `mergeMouseEntities`, `createGuidedMouseRoute`, `createContinuousMouseRoute`; modify

#### Details

- `mergeMouseEntities`의 기존 exact identity 중복 제거를 확장해 preferred additions 우선 병합을 지원한다.
- 병합 시 다음 순서를 지킨다.
  1. `entities`에서 non-mouse와 `formationId`가 있는 mouse를 먼저 보존한다.
  2. additions 중 continuous route mouse를 preferred set으로 만든다.
  3. `entities`의 mouse 중 `formationId`가 없는 legacy/guided mouse는 preferred addition과 AABB가 겹치는 항목을 제거한다.
  4. 겹치지 않는 legacy mouse와 preferred additions를 합친다. 동일 identity는 한 번만 남긴다.
- `createGuidedMouseRoute`의 obstacle 없는 경로와 obstacle이 있는 경로 모두 이 preferred-additions 병합을 사용해야 한다.
- formation 셀을 blocker로 사용하는 현재 안전성 검사는 유지하여 continuous candidate가 formation 셀을 덮지 않게 한다.
- guided mouse의 `routeAction`이 제거되더라도 continuous mouse의 동일 구간 action이 유지되는지 확인한다. 연속 루트가 없는 legacy mouse는 삭제하지 않는다.
- 서버 manifest와 동일한 AABB 조건과 병합 순서를 사용해야 한다.

### I02. Server manifest route parity

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `intersects`, `mergeMouseEntities`, `createGuidedMouseRoute`, `createContinuousMouseRoute`; modify

#### Details

- client와 동일한 strict AABB helper 또는 동등한 조건으로 preferred continuous additions와 기존 mouse를 병합한다.
- formation metadata(`formationId`, `formationKind`, `formationCell`, DEX sequence fields)는 삭제 대상에서 제외한다.
- `createServerManifest`가 생성하는 각 pattern의 `entities`가 client pattern의 상대좌표 entity 목록과 동일한 순서·ID·위치·크기·route metadata를 유지하게 한다.
- bridge entity는 pattern 내부 중복 제거 대상이 아니며 기존 connector 생성 규칙을 유지한다.

## Acceptance Criteria

- [ ] 일반 route에서 AABB가 겹치는 legacy guided mouse가 제거되고 continuous mouse가 남는다.
- [ ] formation 셀, 서로 가까울 뿐 겹치지 않는 mouse, Y축이 달라 AABB가 겹치지 않는 mouse는 보존된다.
- [ ] client/server의 동일 seed pattern entity parity와 route metadata가 유지된다.
- [ ] existing obstacle avoidance, gap guidance, DEX, fall damage behavior가 변경되지 않는다.

## Validation

- `node test/game-systems.test.js`
- `node test/score-validation.test.js`
- `node test/game-core.test.js`

## Commit Message

```text
fix(game): prioritize continuous mice over overlapping guides

Plan: 2026-09-26-mouse-overlap-dex-rate
Phase: P01-mouse-overlap-dex-rate
Task: T01-continuous-route-overlap-cleanup

- remove only AABB-overlapping legacy route mice
- preserve formation cells and continuous route parity
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history
