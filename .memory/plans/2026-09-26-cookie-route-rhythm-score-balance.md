# Plan: 쿠키런식 쥐 루트·오수 속도·정확도 점수 보정

## Goal

일반 장애물 패턴의 쥐 인형을 실제 `requiredActions`에 맞는 안전한 쿠키런식 유도 루트로 재배치하고, 쥐 밀도를 기본 쥐당 최대 7개까지 높인다. 장애물 간격과 패턴 길이를 15% 확장해 회피 여유를 만들며, 오수는 단계별로 한 번에 하나만 표시하되 1000ms/800ms/600ms로 빨라지게 한다. 오수 정확도는 0.5~1.5배의 극단적인 전체 점수 보정으로 반영하고 결과 화면에서 점수 관계를 보여준다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 일반 패턴 쥐 인형의 안전 유도 루트·7배 밀도·클라이언트/서버 재현성 | [P01](../phases/2026-09-26-cookie-route-rhythm-score-balance/P01-guided-mouse-route/phase.md) |
| P02 | `in_progress` | 장애물 내부 간격과 패턴 외부 간격을 15% 완화하고 패턴 길이 확장 | [P02](../phases/2026-09-26-cookie-route-rhythm-score-balance/P02-obstacle-spacing-expansion/phase.md) |
| P03 | `pending` | 단계별 오수 1개 유지와 1000/800/600ms 템포 조정 | [P03](../phases/2026-09-26-cookie-route-rhythm-score-balance/P03-rhythm-tempo/phase.md) |
| P04 | `pending` | 정확도 0.5~1.5배 점수 보정, 서버 검증, 결과·개인기록 표시 | [P04](../phases/2026-09-26-cookie-route-rhythm-score-balance/P04-accuracy-score-breakdown/phase.md) |

## Decision Source

- [확정 결정 문서](../decisions/2026-09-26-cookie-route-rhythm-score-balance.md)

## Global Constraints

- `.memory/current.md`가 가리키는 Task 하나만 순차적으로 구현한다.
- 특수 5×5 쥐 진형, 오수의 상단 HUD 안전 영역, 기존 판정 반경과 로컬 기록 기능을 회귀시키지 않는다.
- 동일 seed에서 클라이언트와 서버가 같은 패턴·entity ID·수집 대상을 생성해야 한다.
- 일반 패턴의 쥐 루트는 해당 패턴의 `requiredActions`에 맞는 안전 경로여야 하며 장애물·gap과 겹치지 않아야 한다.
- 정확도 점수 보정은 클라이언트와 서버에서 동일한 수식으로 계산하고, 서버는 클라이언트가 보낸 최종 점수를 신뢰하지 않는다.
- 각 Task 구현 후 지정된 개별 Node 테스트를 실행하고, 마지막 Phase에서 `npm test`를 실행한다. Windows Node test runner의 `spawn EPERM`이 재현되면 개별 테스트 결과와 함께 기록한다.
