# Plan: Obstacle Frequency and Background Transition

## Goal

요청한 두 곳의 중복 `LOCAL` 표기를 제거하고 HUD 레이아웃을 정리한다. 기존 장애물 패턴의 회피 구조는 보존하면서 모든 구간에서 패턴 사이 간격을 25% 줄이고, 안전 최소 간격은 유지한다. 점수 700점·1800점에서 배경과 난이도 구간을 즉시 함께 전환하도록 조정한다.

## Scope

- 개인기록표 설명의 `LOCAL` 제거
- HUD 정확도·타겟 아래 `LOCAL` 제거 및 패널 높이 축소
- 모든 구간의 장애물 패턴 등장 빈도 25% 증가
- 패턴 간격 축소 시 기존 점프·슬라이드 안전 최소값 보존
- 구간 전환 점수 `1000/2500`을 `700/1800`으로 변경
- 기존 구간별 난이도 배율과 결과 화면의 `LOCAL` 표기 유지

## Non-goals

- 장애물 패턴 내부의 장애물 종류·회피 동작 재설계
- 구간별 난이도 배율 변경
- 배경 이미지·색상·렌더링 자산 변경
- 결과 화면, 저장 경고, 서버 모드 관련 `LOCAL` 표기 변경

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | UI 중복 표기 제거, 장애물 패턴 빈도 증가, 빠른 배경·난이도 전환을 적용한다. | [P01](../phases/2026-09-23-obstacle-frequency-background-transition/P01-obstacle-frequency-background-transition/phase.md) |

## Decision Source

- [2026-09-23-obstacle-frequency-background-transition.md](../decisions/2026-09-23-obstacle-frequency-background-transition.md)
