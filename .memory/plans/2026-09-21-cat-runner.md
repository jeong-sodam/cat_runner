# Plan: 고양이 러너 게임 (cat-runner)

## Goal

브라우저에서 실행되는 16:9 자동 횡스크롤 고양이 러너를 로컬 Node.js + Express + SQLite 환경에 구현한다. Microsoft Entra ID 멀티테넌트 로그인 후 6종 고양이를 매 판 선택하고, W 2단 점프와 S 슬라이딩으로 장애물을 피하며, 쥐 인형·강아지풀을 수집한다. 서버가 수집·충돌·거리 이벤트를 검증해 사용자별 최고 점수를 저장하고 상위 10명 리더보드를 제공한다. 연결 끊김과 브라우저 재접속 시 24시간 동안 진행을 이어할 수 있어야 한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | "done" | 로컬 서버, SQLite, Entra ID 세션, 사용자 온보딩 기반 | [P01](../phases/2026-09-21-cat-runner/P01-foundation-auth-data/phase.md) |
| P02 | "done" | Canvas 게임 루프, 물리, 패턴, 렌더링, 오디오 | [P02](../phases/2026-09-21-cat-runner/P02-game-engine/phase.md) |
| P03 | "in_progress" | 런 저장·복구, 서버 검증, 최고 점수, 리더보드 | [P03](../phases/2026-09-21-cat-runner/P03-run-leaderboard-resume/phase.md) |
| P04 | "pending" | 전체 플로우 통합, 오류 처리, 테스트, 로컬 실행 문서 | [P04](../phases/2026-09-21-cat-runner/P04-integration-verification/phase.md) |

## Global Technical Decisions

## Execution Update

- P03 is complete: results submission, personal rank, and the authenticated top-ten leaderboard are implemented and validated.
- P04 is complete: integration/security regression coverage, common API errors, local setup documentation, and the manual acceptance checklist are implemented and validated.
- Verification: `npm test` passed 61 tests; local health check returned HTTP 200; `.env` and `data/*.sqlite*` are ignored.
- Cosmos DB migration remains a future phase; the current local runtime uses SQLite.

- Runtime: Node.js LTS. 서버는 CommonJS, public JavaScript는 type=module을 사용한다.
- Server: Express 단일 프로세스가 public 정적 파일과 API를 함께 제공한다.
- Authentication: @azure/msal-node authorization-code flow, organizations authority, 서버 측 express-session, SQLite-backed custom session store.
- Database: better-sqlite3 기반 SQLite. Cosmos DB는 이후 교체 가능한 repository 경계만 마련한다.
- Client: HTML5 Canvas, 순수 JavaScript, CSS. 외부 이미지 없이 코드 드로잉으로 시작한다.
- Validation: 모든 테스트는 Node built-in test runner를 사용하고, 구현 Task마다 관련 단위 테스트를 함께 추가한다.
- Local authentication configuration: .env.example에 ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_TENANT_AUTHORITY, ENTRA_REDIRECT_URI, SESSION_SECRET, PORT를 문서화한다. 설정 누락 시 로그인 화면에 안내를 표시한다.
