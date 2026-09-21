# Task: T01 통합 테스트와 예외 처리

## Status: done

## Goal

전체 인증→닉네임→캐릭터 선택→런→연결 복구→점수 검증→결과→리더보드 흐름을 로컬 테스트로 검증하고, 예상 가능한 오류가 사용자에게 복구 가능한 상태로 전달되도록 마무리한다.

## Decision Summary

- 구현은 로컬 Node.js + SQLite에서 먼저 검증한다.
- 네트워크 오류 중 게임은 멈추고 재연결 후 이어간다.
- 인증·검증·저장 오류는 안정적인 error.code와 한국어 UI 메시지로 전달한다.

## Implementation

### I01. HTTP 통합 테스트 harness

- Related Files:
  - test/integration.test.js :: createTestApp(), full flow test cases; new
  - test/helpers/fake-auth.js :: authenticated session fixture; new
  - test/helpers/test-database.js :: isolated SQLite fixture; new

#### Details

- Build createTestApp() with temporary SQLite file, fake MSAL, and injected repositories.
- Test:
  1. unauthenticated /api/me
  2. fake callback creates user and session
  3. nickname set
  4. run create
  5. event append and snapshot
  6. valid complete
  7. personal best and top ten response
  8. second lower score does not replace best
  9. expired run is not resumable
- Use a fresh database per test and clean temp files in finally.

### I02. Error contract and safe boundaries

- Related Files:
  - src/middleware/error-handler.js :: apiError(), notFoundHandler(), errorHandler(); modify
  - src/server.js :: middleware order and graceful shutdown; modify
  - public/js/app/api-client.js :: requestJson(), mapApiError(); new
  - public/js/ui/error-banner.js :: showError(), showRetry(); new

#### Details

- API errors always return { error: { code, message, retryable } } and never stack traces in production mode.
- Map 400, 401, 404, 409, 422, 500, and network failures to Korean retryable messages.
- On 401, preserve a pending result locally and route to sign-in rather than silently losing it.
- On SIGINT/SIGTERM close HTTP server and database cleanly.
- Cap JSON request body to a small safe limit and reject malformed JSON with BAD_JSON.

### I03. Regression checks

- Related Files:
  - test/security-regression.test.js :: authorization, payload, XSS, and error tests; new

#### Details

- Verify user A cannot access user B run, snapshot, events, or result.
- Verify malformed JSON, oversized nickname payload, invalid cat id, invalid event type, and expired session return stable errors.
- Verify nickname and email are text-rendered, not executed as HTML.
- Verify API 404 and internal errors do not leak filesystem paths or secrets.

## Acceptance Criteria

- [ ] Full happy path passes without external network or Azure dependency using fakes.
- [ ] All protected resources enforce ownership and authentication.
- [ ] Recoverable network errors preserve local run state and show retry.
- [ ] API errors have stable shape and no secret/stack leakage.
- [ ] npm test passes from a clean checkout after npm install.

## Validation

- npm test
- node --test test/integration.test.js test/security-regression.test.js

## Commit Message

~~~text
test(integration): verify authenticated runner flow and errors

Plan: 2026-09-21-cat-runner
Phase: P04-integration-verification
Task: T01-integration-tests-errors

- add full local flow integration fixtures
- standardize API errors and retry handling
- cover ownership and security regressions
~~~

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: committed
