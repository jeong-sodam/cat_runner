# Phase: P01 에셋·충돌·낙사 구현

## Tasks

| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `done` | 6개 투명 PNG를 생성하고 아이템 프리로드·렌더링·벡터 폴백을 연결한다. | [T01](./T01-item-assets-rendering.md) |
| T02 | `done` | 변형별 다각형 피격범위와 결정론적 구멍 생성·낙하·복귀를 클라이언트 게임에 연결한다. | [T02](./T02-polygon-collision-fall-gameplay.md) |
| T03 | `in_progress` | 서버 패턴 매니페스트와 `fall_damage` 이벤트 검증을 추가하고 통합 회귀를 닫는다. | [T03](./T03-server-fall-event-validation.md) |

## Progress

- done: 2/3 (active: T03)

## Current Execution

- T01 is complete and committed after render and app-flow validation.
- T02 is complete and validated.
- T03 is the next active task.
