# Plan: 폰트·고양이 능력치·쥐 도트아트

## Goal

게임 전체의 한국어 폰트와 줄바꿈을 정리하고, 고양이 능력치를 5개 핵심 항목으로 재배치한다. 동시에 일반 쥐 인형을 약 2배로 늘리고, 장애물 없는 빈 구간에 5×5 도트아트와 5% 확률의 DEX 특별 이벤트를 결정론적으로 생성한다. 클라이언트와 서버 패턴 매니페스트의 결과가 일치하며, 점프력 1등급도 기본 장애물을 회피할 수 있고 모든 UI·게임플레이 회귀 테스트가 통과하는 것을 완료 기준으로 한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 5개 능력치 모델, 공통 효과 동작, 폰트 및 고양이 선택 UI 정리 | [P01](../phases/2026-09-23-font-cat-stats-mouse-formation/P01-stat-and-font-foundation/phase.md) |
| P02 | `in_progress` | 일반 쥐 증가, 5×5 도트아트, DEX 이벤트와 장애물 생성 제어 | [P02](../phases/2026-09-23-font-cat-stats-mouse-formation/P02-mouse-formations-and-dex/phase.md) |
| P03 | `pending` | 서버 패턴 동기화, 회귀 테스트 및 통합 검증 | [P03](../phases/2026-09-23-font-cat-stats-mouse-formation/P03-parity-and-verification/phase.md) |

## Execution Order

1. P01-T01에서 능력치 모델과 런타임 효과를 먼저 고정한다.
2. P01-T02에서 UI·캔버스 폰트와 5개 능력치 표시를 적용한다.
3. P02에서 클라이언트 패턴/월드 생성과 DEX 일시 정지를 구현한다.
4. P03에서 서버 매니페스트를 같은 결정론적 규칙으로 맞추고 전체 테스트를 통과시킨다.
