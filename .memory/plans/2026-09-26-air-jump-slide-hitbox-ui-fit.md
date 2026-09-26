# Plan: 공중 숙이기·2단 점프·피격범위·무스크롤 UI 개선

## Goal

고양이 러너의 공중 조작을 완성하고, 점프-숙이기 패턴의 안전 여유와 장애물 피격범위를 조정하며, 모든 비게임 UI가 스크롤 없이 한 화면에 들어오도록 개선한다. 공중에서 S를 한 번 누르면 즉시 하강하고, 공중 W는 현재 위치를 유지한 채 한 번 더 점프해야 하며, 320px 폭에서도 캐릭터 선택·기록표의 모든 정보가 유지되어야 한다.

## Scope and Non-goals

- 포함: 키 입력 edge 처리, 공중 하강, 2단 점프, jump-slide 패턴 간격, 장애물 전용 피격범위, UI 쉘 높이, 반응형 카드·표·폰트.
- 제외: 고양이 능력치 수치 재배치, 신규 이미지 제작, 서버 순위표 API 변경, 게임 캔버스의 16:9 비율 변경.
- 기존 Pretendard 로컬 폰트 로딩과 캔버스 글자 맞춤은 유지하고 이번 UI 축소 규칙에 맞게 확장한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 공중 S와 현재 위치를 보존하는 2단 점프 구현 | [P01](../phases/2026-09-26-air-jump-slide-hitbox-ui-fit/P01-air-input-and-double-jump/phase.md) |
| P02 | `done` | jump-slide 패턴 간격과 장애물 전용 피격범위 조정 | [P02](../phases/2026-09-26-air-jump-slide-hitbox-ui-fit/P02-pattern-hitbox-calibration/phase.md) |
| P03 | `done` | UI 화면 높이와 카드·표·타이포그래피를 무스크롤로 조정 | [P03](../phases/2026-09-26-air-jump-slide-hitbox-ui-fit/P03-responsive-ui-no-scroll/phase.md) |
| P04 | `in_progress` | 입력·물리·패턴·충돌·반응형 회귀 검증 | [P04](../phases/2026-09-26-air-jump-slide-hitbox-ui-fit/P04-regression-verification/phase.md) |

## Dependency Order

1. P01에서 입력 상태와 플레이어 상태 전이를 확정한다.
2. P02에서 P01의 공중 동작에 맞춰 패턴과 충돌을 조정한다.
3. P03에서 게임 캔버스와 UI 화면의 레이아웃 경계를 분리한다.
4. P04에서 전체 회귀 테스트와 브라우저 스모크 검증을 완료한다.
