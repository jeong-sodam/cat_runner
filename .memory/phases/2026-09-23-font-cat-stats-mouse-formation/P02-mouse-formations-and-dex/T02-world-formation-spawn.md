# Task: T02 월드 도트아트 배치와 DEX 제어

## Status: done ✅

## Goal

패턴 stream의 formation metadata를 실제 월드 entity로 변환하고, DEX가 화면에 존재하는 동안 새 장애물 패턴만 일시 정지한다. D·E·X가 모두 화면 밖으로 이탈한 뒤 정상 생성이 재개되도록 한다.

## Decision Summary

- formation mouse는 기존 42×42 크기, 34px step으로 빈 corridor에 배치한다.
- DEX 시작 전 이미 화면에 존재하는 장애물은 제거하지 않는다.
- DEX의 종료 조건은 수집 완료가 아니라 D·E·X entity가 모두 화면 밖으로 이탈하는 것이다.

## Implementation

### I01. 게임 상태와 월드 spawn

- Related Files:
  - `public/js/game/state.js` :: `createGameState`; modify
  - `public/js/game/world.js` :: `spawnNextPattern`, `updateWorldEntities`; modify
  - `public/js/app/app-controller.js` :: `onStep` world/collision flow; read-only unless state hook is required

#### Details

- game state에 `formationEvent`를 nullable object로 추가한다. 기본값은 `null`이며 DEX가 활성화되면 `{ type: 'dex', entityIds: [], endsAtX: number }`를 기록한다.
- `spawnNextPattern`은 일반 pattern entity와 formation cell을 같은 world coordinate로 변환한다. entity ID는 기존 `${pattern.id}-${patternIndex}-${entityIndex}` 규칙을 유지하고 formation cell에도 pattern/index를 포함한다.
- normal formation은 pattern의 reserved empty corridor anchor에 `x = startX + anchorX + column * FORMATION_CELL_STEP`, `y = anchorY + row * FORMATION_CELL_STEP`로 배치한다. 생성된 entity는 `type: 'mouse'`, `variant: 'toy'`, `collectible: true`, `formationId`, `formationKind`, `formationCell` metadata를 가진다.
- DEX는 D/E/X를 한 패턴의 연속 formation segment로 배치한다. 각 글자는 동일한 5×5 mask 크기를 사용하고, 글자 사이에는 `FORMATION_SEQUENCE_GAP = 48` 이상을 둔다. DEX 전용 segment에는 obstacle entity를 넣지 않는다.
- DEX spawn 직후 `state.formationEvent.endsAtX`를 X formation의 오른쪽 끝으로 설정하고 `nextPatternX`를 유지한 채 `updateWorldEntities`의 추가 패턴 loop를 중단한다. 이를 통해 horizon 선행 spawn으로 장애물이 DEX 뒤에 미리 생기지 않게 한다.
- `updateWorldEntities`는 `formationEvent`가 있고 `worldOffset >= endsAtX`가 될 때까지 obstacle pattern spawn을 중단한다. 기존 `worldEntities`와 `worldGaps` 필터는 계속 수행한다.
- 모든 D/E/X mouse entity가 화면 이탈 기준을 통과하면 `formationEvent`를 null로 되돌리고 다음 호출부터 기존 pattern stream을 재개한다. `collected` 여부는 종료 조건에 사용하지 않는다.
- DEX 중에도 기존 화면의 obstacle은 `worldEntities`에 남아 충돌할 수 있다. 새 obstacle만 억제한다.

### I02. 월드 lifecycle 테스트

- Related Files:
  - `test/game-systems.test.js` :: `spawnNextPattern`, `updateWorldEntities` formation/DEX tests; modify

#### Details

- normal formation entity의 x/y, 5×5 cell count, pattern metadata와 obstacle separation을 검증한다.
- DEX spawn 후 `state.formationEvent`가 생성되고, event가 활성인 동안 `patternStream.next`가 추가 장애물 패턴을 소비하지 않는지 검증한다.
- 기존 obstacle이 DEX 중 삭제되지 않는지 확인한다.
- D/E/X가 화면 밖으로 이동한 상태에서 다음 update가 event를 종료하고 일반 패턴을 다시 spawn하는지 확인한다.
- formation mouse가 수집되어도 event가 조기 종료되지 않는지 확인한다.

## Acceptance Criteria

- [ ] normal formation이 장애물 없는 월드 corridor에 실제 entity로 표시된다.
- [ ] DEX 중 신규 obstacle pattern 생성이 멈춘다.
- [ ] 기존 obstacle은 DEX 중 유지된다.
- [ ] D/E/X가 화면 밖으로 나가면 정상 생성이 재개된다.

## Validation

- `npm test -- --test-name-pattern="world|formation|DEX|spawn"`

## Commit Message

```text
feat(game): spawn safe mouse formations and pause obstacles for DEX

Plan: 2026-09-23-font-cat-stats-mouse-formation
Phase: P02-mouse-formations-and-dex
Task: T02-world-formation-spawn

- map five-by-five cells into deterministic world entities
- pause only new obstacle patterns during DEX
- resume after all DEX letters leave the screen
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending (이번 실행에서 생성)
