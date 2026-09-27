# Plan: 연속 쥐 인형 루트와 2단계 구멍 품질 개선

## Goal

게임 시작부터 장애물이 없는 구간까지 쥐 인형을 안전한 주행 가이드로 계속 이어서 생성한다. 기존 5×5 모양은 유지하고 앞뒤 루트를 연결한다. 2단계(outside)와 3단계(home_night)의 구멍은 단계별 빈도·폭·안전 간격·시각 표현을 개선하며, 클라이언트와 서버 manifest가 동일한 결정론적 배치를 사용하도록 한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | 연속 쥐 루트, 단계별 구멍 생성·시각 품질, client/server parity 및 회귀 검증 | [P01](../phases/2026-09-26-continuous-mouse-route-gap-quality/P01-continuous-route-and-gap-quality/phase.md) |

## Decision Source

- [확정 결정 문서](../decisions/2026-09-26-continuous-mouse-route-gap-quality.md)

## Global Constraints

- `.memory/current.md`가 가리키는 Task 하나만 순차적으로 구현한다.
- 일반 쥐 루트는 시작 직후부터 생성하고, 장애물이 없는 구간에도 항상 하나 이상의 쥐가 보이도록 연결한다.
- 일반 루트는 약 34~42px 간격과 구간당 5~7개를 기본으로 하며, 장애물·구멍·5×5 formation과 겹치지 않는다.
- 2단계는 `outside`(`minScore: 400`), 3단계는 `home_night`(`minScore: 1800`)이며, 2단계 구멍은 1단 점프로 통과 가능해야 한다.
- 구멍은 2단계 20%(140~180px), 3단계 30%(160~220px)로 생성하고, 구멍 사이에 최소 한 개의 안전 패턴을 둔다.
- 동일 seed에서 클라이언트와 서버의 패턴 ID, entity ID, route 위치, gap 위치·폭이 일치해야 한다.
- 기존 최저 점프력 1 안전성, 2단 점프 패턴, formation/D E X 동작, 낙사 이벤트 계약을 깨뜨리지 않는다.
- 각 Task의 지정 Node 테스트를 실행하고, Phase 마지막에 `npm test`를 실행한다. Windows Node test runner의 `spawn EPERM` 또는 better-sqlite3 native cleanup 문제가 재현되면 개별 테스트 결과와 환경 차단을 함께 기록한다.
