# Task: T02 로컬 실행 문서와 수동 검수

## Status: done

## Goal

다른 개발자가 저장소만 받아도 로컬 SQLite와 Microsoft Entra ID 멀티테넌트 로그인으로 게임을 실행하고, 핵심 게임 규칙을 수동 검수할 수 있도록 문서와 환경 예시를 완성한다.

## Decision Summary

- 현재 운영 대상은 로컬 실행이며 Cosmos DB 배포는 후속 작업이다.
- Entra 설정이 없는 경우에도 서버는 실행하고 로그인 화면에 설정 안내를 표시한다.
- 실계정 테스트는 localhost callback을 등록한 개발자만 수행한다.

## Implementation

### I01. README와 환경 변수 문서

- Related Files:
  - README.md :: 로컬 설치·실행·테스트·구성 문서; modify
  - .env.example :: Entra app registration 값과 설명; modify
  - .gitignore :: .env, data/*.sqlite, logs/ 제외; modify

#### Details

- README sections:
  - prerequisites: Node.js LTS, npm
  - npm install, npm test, npm run dev, npm start
  - local SQLite location and reset instructions
  - Entra app registration: supported account types = any organizational directory, redirect URI = http://localhost:3000/auth/callback, client secret handling
  - copy .env.example to .env and fill values
  - missing config behavior
  - game controls W, S, P and pause button
  - score formula, cat abilities, three zone thresholds, power-up odds, leaderboard rules
  - known limitation: full email is shown on leaderboard by product decision
- Never include real client id, client secret, access token, or personal email in committed examples.

### I02. Manual acceptance checklist

- Related Files:
  - docs/manual-acceptance.md :: reproducible manual test cases; new

#### Details

- Checklist must cover:
  - sign-in and sign-out
  - first nickname and duplicate nickname
  - all six cats and visible stat modifiers
  - W double jump, S slide, collision health, game over
  - mouse score, distance score, all four grass outcomes
  - 1000 and 2500 transitions
  - pause key/button, separate audio sliders, mute
  - offline pause, reload within 24h resume prompt, expired run
  - valid result submission, personal best replacement, top ten tie order
  - responsive 16:9 and no user-string HTML injection

### I03. Final plan consistency check

- Related Files:
  - .memory/plans/2026-09-21-cat-runner.md :: status and verification notes; modify
  - .memory/phases/2026-09-21-cat-runner/P04-integration-verification/phase.md :: progress; modify

#### Details

- Mark every Phase and Task status only after its commit and validation.
- Record the exact local commands that passed.
- Do not mark cloud Cosmos migration complete; it remains a future phase.

## Acceptance Criteria

- [ ] A fresh developer can follow README to start the local app.
- [ ] Entra callback and missing-config paths are documented.
- [ ] Manual checklist covers every confirmed decision.
- [ ] Secrets, database files, and logs are ignored.

## Validation

- npm test
- Follow docs/manual-acceptance.md from a clean terminal
- Confirm git status does not include .env or data/*.sqlite

## Commit Message

~~~text
docs(local): document cat runner setup and acceptance checks

Plan: 2026-09-21-cat-runner
Phase: P04-integration-verification
Task: T02-local-run-documentation

- document local sqlite and entra setup
- add manual gameplay acceptance checklist
- ignore local secrets and database files
~~~

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: committed
