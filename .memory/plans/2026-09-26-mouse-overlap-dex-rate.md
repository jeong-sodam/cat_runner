# Plan: Mouse Overlap Cleanup and DEX Rate

## Goal

일반 주행 루트에서 기존 안내 쥐와 연속 루트 쥐가 실제 사각형으로 겹치는 현상을 제거한다. 연속 루트 쥐를 우선 유지하고 5×5 formation 내부의 의도된 인접 배치는 보존한다. 알파벳 formation의 DEX 분기를 5%에서 15%로 높이되, DEX 이후 다음 2개 패턴에는 재등장하지 않도록 클라이언트와 서버 manifest의 결정론적 생성 규칙을 동일하게 갱신한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `complete` | 일반 루트 겹침 제거, DEX 15%·2패턴 쿨다운, client/server parity 회귀 검증 | [P01](../phases/2026-09-26-mouse-overlap-dex-rate/P01-mouse-overlap-dex-rate/phase.md) |

## Decision Source

- [확정 결정 문서](../decisions/2026-09-26-mouse-overlap-dex-rate.md)

## Global Constraints

- `.memory/current.md`가 가리키는 Task 하나만 순차적으로 구현한다.
- 일반 쥐 루트에서만 실제 AABB 겹침을 제거한다. heart, star, clover, thumbsUp, alphabet/DEX formation 셀은 서로 인접하거나 겹쳐 보이는 배치를 변경하지 않는다.
- 연속 루트 쥐(`routeKind: "continuous"`)를 우선 유지하고, 그와 AABB가 겹치는 기존 안내 쥐만 제거한다. 단순 근접이나 Y축이 다른 쥐는 제거하지 않는다.
- DEX 확률은 alphabet formation 선택 시 15%로 적용하며, DEX가 생성된 패턴 뒤의 다음 2개 패턴에서는 DEX를 금지한다. 쿨다운은 zone과 무관하게 stream/manifest 시퀀스 기준으로 감소한다.
- 기존 D/E/X 3문자 확장, DEX의 장애물 억제, formation 수집, 낙사·무적·점수 검증 계약을 유지한다.
- 클라이언트 `createPatternStream(seed)`와 서버 `createServerManifest(seed, { zoneId })`는 random 호출 순서, formation 결과, route entity 우선순위, entity metadata가 동일해야 한다.
- 각 Task의 지정 Node 테스트를 실행하고, Phase 마지막에 `npm test`를 실행한다. Windows Node test runner의 `spawn EPERM` 또는 better-sqlite3 native cleanup 문제가 재현되면 개별 테스트 결과와 환경 차단을 함께 기록한다.
