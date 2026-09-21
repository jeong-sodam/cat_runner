# Task: T01 프로젝트 스캐폴드와 정적 서버

## Status: done

## Goal

Node.js + Express 단일 서버가 로컬에서 실행되고, public 정적 파일과 health API를 제공하는 최소 실행 기반을 만든다. 이후 Task가 의존할 설정 로더와 테스트 실행 명령을 고정한다.

## Decision Summary

- 서버는 Express가 정적 게임 파일과 API를 함께 제공한다.
- 서버는 CommonJS, 브라우저 코드는 ES module을 사용한다.
- Entra 설정이 없어도 서버는 실행되며, 인증 화면에서 설정 누락을 안내할 수 있어야 한다.

## Implementation

### I01. Node 프로젝트와 환경 설정

- Related Files:
  - package.json :: 프로젝트 메타데이터, scripts, runtime dependencies; new
  - .env.example :: 로컬 환경변수 계약; new
  - src/config.js :: loadConfig() 구현; new

#### Details

- package.json scripts:
  - start: node src/server.js
  - dev: node --watch src/server.js
  - test: node --test
- dependencies:
  - express
  - dotenv
  - express-session
  - @azure/msal-node
  - better-sqlite3
- loadConfig() 반환 필드:
  - port: number, 기본값 3000
  - databasePath: string, 기본값 data/cat-runner.sqlite
  - sessionSecret: string, 개발 기본값은 사용하지 말고 누락 여부를 별도 반환
  - entraClientId: string | null
  - entraClientSecret: string | null
  - entraAuthority: string, 기본값 https://login.microsoftonline.com/organizations
  - entraRedirectUri: string, 기본값 http://localhost:3000/auth/callback
  - authConfigured: boolean
- .env.example에는 PORT, DATABASE_PATH, SESSION_SECRET, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_TENANT_AUTHORITY, ENTRA_REDIRECT_URI를 설명과 함께 기록한다. 비밀값은 저장소에 넣지 않는다.

### I02. Express 앱과 정적 파일

- Related Files:
  - src/server.js :: createApp(config, dependencies), startServer(); new
  - public/index.html :: 초기 앱 루트; new
  - public/styles.css :: 기본 16:9 게임 셸 스타일; new

#### Details

- createApp()은 테스트에서 서버를 listen하지 않고 supertest 없이 Node fetch로 호출할 수 있도록 Express app만 반환한다.
- public 디렉터리를 정적 제공하고 public/index.html을 fallback으로 제공한다.
- GET /api/health 응답:
  - HTTP 200
  - JSON { ok: true, service: "cat-runner" }
- 오류 응답은 JSON { error: { code: string, message: string } } 형식으로 통일할 기반 middleware를 등록한다.
- index.html에는 16:9 canvas를 담을 #game-shell, #game-canvas, #screen-root를 만들고 main module 진입점은 이후 Task에서 연결한다.

### I03. 스캐폴드 검증

- Related Files:
  - test/server.test.js :: health endpoint와 정적 파일 제공 검증; new

#### Details

- createApp()을 import해 ephemeral HTTP server로 실행한다.
- /api/health가 정확한 JSON을 반환하는지 검증한다.
- /index.html이 200과 text/html을 반환하는지 검증한다.
- 모듈 import 시 자동으로 서버가 시작되지 않는지 검증한다.

## Acceptance Criteria

- [ ] npm install 후 npm test가 통과한다.
- [ ] npm start로 localhost:3000에 접속하면 정적 index.html이 표시된다.
- [ ] GET /api/health가 200과 { ok: true, service: "cat-runner" }를 반환한다.
- [ ] 비밀값이 .env.example 외 파일에 하드코딩되지 않는다.

## Validation

- npm install
- npm test
- npm start 후 브라우저에서 http://localhost:3000 및 http://localhost:3000/api/health 확인

## Commit Message

~~~text
feat(scaffold): initialize cat runner express app

Plan: 2026-09-21-cat-runner
Phase: P01-foundation-auth-data
Task: T01-project-scaffold

- add Node and Express project scripts
- add environment configuration contract
- serve initial game shell and health endpoint
~~~

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
