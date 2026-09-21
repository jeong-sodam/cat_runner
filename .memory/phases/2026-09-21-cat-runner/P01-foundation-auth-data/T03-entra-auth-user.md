# Task: T03 Microsoft Entra 인증과 사용자 온보딩

## Status: done

## Goal

Microsoft Entra ID 멀티테넌트 조직 계정의 authorization-code 로그인과 서버 세션을 연결하고, 최초 로그인 사용자의 닉네임 설정 API를 제공한다. Entra 설정이 없을 때는 로그인 화면이 안내할 수 있는 명확한 오류 코드를 반환한다.

## Decision Summary

- 모든 조직 디렉터리의 work/school account를 허용하는 organizations authority를 사용한다.
- 서버 측 express-session과 SQLiteSessionStore를 사용한다.
- 리더보드 표시용 이메일은 Entra claims에서 확보한 전체 값을 저장한다.
- 닉네임은 중복 허용이며, 빈 문자열만 거부한다.

## Implementation

### I01. MSAL Node client와 인증 라우트

- Related Files:
  - src/auth/msal-client.js :: createMsalClient(), buildAuthUrl(), redeemAuthorizationCode(); new
  - src/auth/auth-routes.js :: registerAuthRoutes(app, deps); new
  - src/auth/auth-middleware.js :: requireAuth, getSessionUser; new

#### Details

- MSAL config:
  - auth.clientId = config.entraClientId
  - auth.clientSecret = config.entraClientSecret
  - auth.authority = config.entraAuthority, default https://login.microsoftonline.com/organizations
- GET /auth/signin:
  - authConfigured=false이면 HTTP 503 and error.code=AUTH_CONFIG_MISSING
  - configured이면 authorization code URL을 생성해 Microsoft login으로 302 redirect
  - scopes are [openid, profile, email]
- GET /auth/callback:
  - query.error가 있으면 HTTP 401 with error.code=AUTH_FAILED
  - query.code가 없으면 HTTP 400 with error.code=AUTH_CODE_MISSING
  - redeemAuthorizationCode() uses acquireTokenByCode
  - account claims must contain oid and tid; otherwise reject
  - identity key is tid + ":" + oid
  - email is claims.preferred_username || claims.email || account.username; missing email rejects with AUTH_EMAIL_MISSING
  - upsert user, set req.session.user = { userId, entraSubject, tenantId, email, nickname }, redirect to /
- GET /auth/signout destroys the session and redirects to /.
- requireAuth returns HTTP 401 with AUTH_REQUIRED for protected API routes.

### I02. 사용자 API

- Related Files:
  - src/services/user-service.js :: getOrCreateUserFromClaims(), setNickname(); new
  - src/routes/user-routes.js :: registerUserRoutes(app, deps); new

#### Details

- GET /api/me:
  - unauthenticated: { authenticated: false }
  - authenticated: { authenticated: true, user: { id, email, nickname } }
- PATCH /api/me/nickname:
  - requires auth
  - body shape { nickname: string }
  - trim surrounding whitespace, reject empty string with 400 NICKNAME_REQUIRED
  - preserve all non-empty user characters; request body size is limited by the global JSON parser
  - duplicate nicknames are accepted
  - response returns updated user without exposing session secret or raw claims
- The user table stores tenant_id and entra_subject, never the client secret or access token.

### I03. 인증 단위 테스트

- Related Files:
  - test/auth.test.js :: fake MSAL and session route tests; new

#### Details

- Inject fake MSAL client and in-memory repositories; no real Microsoft network call in tests.
- Verify missing config, signin redirect, callback code error, missing oid/tid, successful account creation, session assignment, signout, requireAuth 401, nickname update, duplicate nickname acceptance.

## Acceptance Criteria

- [ ] A configured local app redirects to the organizations endpoint and returns to / after callback.
- [ ] Successful callback creates or finds a user keyed by tenant and object id.
- [ ] Session survives a request through SQLiteSessionStore.
- [ ] Missing Entra configuration returns AUTH_CONFIG_MISSING rather than crashing the server.
- [ ] Nickname onboarding works with duplicate names and rejects only empty input.

## Validation

- node --test test/auth.test.js
- npm test
- Manual only with real credentials: set .env from .env.example, register http://localhost:3000/auth/callback, run npm start, complete sign-in.

## Commit Message

~~~text
feat(auth): add multitenant entra session login

Plan: 2026-09-21-cat-runner
Phase: P01-foundation-auth-data
Task: T03-entra-auth-user

- add MSAL authorization-code routes
- persist authenticated users and sessions in sqlite
- add nickname onboarding API
~~~

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: pending
