# Cat Runner 개발 및 운영 안내

이 문서는 로컬 플레이 기능을 유지하면서 인증 백엔드와 공개 배포를 관리하는 개발자를 위한 안내입니다. 로컬 플레이어는 이 설정을 할 필요가 없습니다. 저장소 루트의 [README](../README.md)에서 바로 실행 방법을 확인할 수 있습니다.

## 로컬 개발

Node.js 22 또는 24와 npm을 사용합니다. Windows PowerShell에서는 `npm.cmd`, macOS/Linux 터미널에서는 `npm`을 실행하세요.

```powershell
npm.cmd install
npm.cmd start
```

개발 중 자동 재시작은 `npm.cmd run dev` 또는 `npm run dev`를 사용합니다. 게임은 <http://localhost:3000>에서 확인할 수 있으며, `.env`나 인증 설정 없이 브라우저 로컬 모드로 플레이할 수 있습니다.

### 테스트

```powershell
node --test test/integration.test.js test/security-regression.test.js
npm.cmd test
```

로컬 `.env`에 인증 설정이 있으면 인증 테스트의 기대 환경을 맞추기 위해 실행 전에 아래 변수를 비웁니다.

```powershell
$env:ENABLE_GUEST_MODE = "false"
$env:ENTRA_CLIENT_ID = ""
$env:ENTRA_CLIENT_SECRET = ""
$env:ENTRA_TENANT_AUTHORITY = ""
$env:ENTRA_REDIRECT_URI = ""
npm.cmd test
```

## 로컬 데이터와 초기화

브라우저 로컬 모드의 개인 기록과 진행 중 상태는 해당 브라우저의 로컬 저장소에 보관되며 서버로 업로드되거나 다른 브라우저와 공유되지 않습니다. 진행 상태는 플레이 중 약 1초마다, 페이지를 떠날 때 저장됩니다. 다시 열면 이어하기 또는 새 게임을 선택할 수 있습니다. 완료하거나 직접 버리면 진행 상태가 삭제됩니다.

서버 측 SQLite 데이터베이스는 기본적으로 `data/cat-runner.sqlite`에 있습니다. 아래 명령은 서버 측 실행 기록, 세션, 리더보드 데이터베이스와 SQLite의 공유 메모리/WAL 파일을 삭제합니다. 브라우저에 저장된 개인 기록은 삭제하지 않습니다. 실행 중인 서버를 먼저 중지한 뒤 사용하세요.

```powershell
Remove-Item data/cat-runner.sqlite, data/cat-runner.sqlite-shm, data/cat-runner.sqlite-wal -ErrorAction SilentlyContinue
```

다음 서버 시작 시 데이터베이스가 다시 생성됩니다. 이 명령은 되돌릴 수 없으므로 서버 기록을 초기화하려는 경우에만 실행하세요.

## 선택 사항: Microsoft Entra ID 백엔드

기존 인증 백엔드는 개발용으로 유지됩니다. 현재 게임 화면에는 정상 동작하는 로그인 기능이 없으므로, Entra 설정은 로컬 플레이에 필요하지 않습니다. `.env`, 클라이언트 암호, 액세스 토큰, 개인 이메일 주소를 저장소에 커밋하지 마세요.

Azure 포털에서 앱 등록을 만들 때 다음을 설정합니다.

1. 지원되는 계정 유형: 모든 조직 디렉터리의 계정(다중 테넌트).
2. 플랫폼: Web.
3. 리디렉션 URI: `http://localhost:3000/auth/callback`.
4. 클라이언트 암호를 만들고 값은 로컬 `.env` 또는 암호 관리자에만 보관합니다.

`.env.example`을 `.env`로 복사하고 필요한 값을 입력합니다.

```dotenv
PORT=3000
DATABASE_PATH=data/cat-runner.sqlite
SESSION_SECRET=use-a-long-random-local-value
ENTRA_CLIENT_ID=your-application-client-id
ENTRA_CLIENT_SECRET=your-local-client-secret
ENTRA_TENANT_AUTHORITY=https://login.microsoftonline.com/organizations
ENTRA_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 기존 게스트 API 모드

`ENABLE_GUEST_MODE=true`는 기존 게스트 인증 API만 활성화합니다. 브라우저 로컬 플레이에는 필요하지 않으며 게임 화면에 게스트 로그인 버튼을 추가하지도 않습니다. 이 API는 `.local.invalid` 이메일 주소를 사용하는 임시 계정을 만들 수 있습니다. `NODE_ENV=production`이면 자동으로 비활성화되므로 공개 배포에서 켜지 마세요.

```dotenv
ENABLE_GUEST_MODE=true
```

Entra 변수를 설정하지 않아도 게임 화면은 제공됩니다. 현재 화면의 로그인 동작은 개발 안내를 표시하며, 보호된 API를 호출하려면 유효한 인증과 설정이 필요합니다.

## Render 공개 배포

Cat Runner는 `render.yaml`을 사용하는 Render Blueprint Node 웹 서비스로 구성되어 있습니다. 설정된 지역은 싱가포르, 플랜은 Free입니다. 배포하려면 Render에서 GitHub의 `jeong-sodam/cat_runner` 저장소에 접근하도록 연결하고 저장소 루트의 `render.yaml`로 Blueprint를 생성한 뒤 설정을 확인하고 적용합니다.

- 빌드 명령: `npm ci`
- 시작 명령: `npm start`
- 상태 확인 경로: `/api/health`
- `main` 브랜치 배포: 연결된 CI 검사가 통과한 뒤 시작

첫 배포 후 Render가 할당한 HTTPS 주소를 확인하세요. 실제 주소는 Render가 정하므로 저장소에는 고정 주소가 없습니다. 방문자는 최신 브라우저에서 URL을 열고 로컬 플레이를 선택하면 됩니다. 개인 기록은 브라우저별로 분리되며, 이 배포는 공유 리더보드를 제공하지 않습니다.

Render Free 서비스는 15분간 요청이 없으면 절전 상태가 되고, 다음 요청에서 다시 시작하는 데 약 1분이 걸릴 수 있습니다. SQLite를 포함한 서버 파일은 임시 저장 공간에 있으므로 절전, 재시작 또는 재배포 시 사라질 수 있습니다. [Render Free 인스턴스 제한](https://render.com/docs/free)에서 최신 제한을 확인하세요.

<a id="manual-acceptance"></a>

## 수동 승인 체크리스트

전체 게임플레이, 복구, 반응형 UI, 오류 경계, 공개 Render 배포 체크리스트를 아래에 보관합니다. 각 항목은 브라우저에서 직접 확인해야 하는 수동 검증이며, 자동 테스트가 대신하지 않습니다. 새 브라우저 세션이 필요한 항목은 새 세션에서 확인하고 각 항목의 결과를 기록하세요.

### 시작

`npm.cmd install` 및 `npm.cmd start`를 실행할 때 `.env`를 만들거나 수정하지 말고, <http://localhost:3000>을 엽니다.

### Visual refresh smoke test

- [ ] On a fresh load, no pause modal is visible before the first pause action.
- [ ] Press `P`, confirm the Korean pause panel appears, then press `P` again and confirm the run resumes.
- [ ] Click the on-screen pause button and confirm it has the same behavior as `P`.
- [ ] Confirm auth, nickname, character selection, pause, result, and leaderboard copy is Korean.
- [ ] Confirm all six character cards show distinct preview images and the black card is selected by default.
- [ ] In DevTools Network request blocking, block one `/assets/cat-runner/` image; reload and confirm the affected card or scene remains usable through its fallback.
- [ ] Press `W` during a run and confirm the jump pose; hold `S` on the ground and confirm the slide pose.
- [ ] Inspect the daytime home, outside, and nighttime home zones and confirm their backgrounds differ.
- [ ] Resize to about 500px wide and confirm buttons remain reachable, cards remain selectable, and wide panels/tables scroll instead of clipping actions.

### Authentication and onboarding

- [ ] With no `.env` and no Entra variables configured, start the server and confirm the game shell loads without an ID/configuration error.
- [ ] Choose **로컬로 플레이** and confirm cat selection opens without signing in or creating an account.
- [ ] Choose **로그인** and confirm a development notice says login is planned and local play is available; it must not navigate to a broken login flow.
- [ ] Confirm browser-local play does not call `/auth/guest` or require `ENABLE_GUEST_MODE`.
- [ ] Optional backend-only check: with valid local Entra configuration, exercise the auth endpoints and confirm the callback returns to the game shell.

### Character selection and movement

- [ ] Confirm all six choices are available: black, white, calico, cheese, mackerel, and chaos.
- [ ] Select each cat and confirm its visible speed, jump, slide, item-duration, and health modifiers change as documented on the card.
- [ ] Start a run, press `W`, and verify a jump. Press `W` again while airborne and verify the second jump; holding `W` must not create unlimited jumps.
- [ ] Hold `S` on the ground and verify the cat slides with a shorter hitbox. Release `S` and verify the normal hitbox returns.
- [ ] Hit an obstacle and verify health decreases once. Continue until health reaches zero and verify game over.
- [ ] Pause with `P`, resume with `P`, pause with the on-screen button, and verify simulation time does not advance while paused.

### Collection, effects, scoring, and zones

- [ ] Collect a mouse toy and verify the mouse counter increases and the score gains 10 points.
- [ ] Travel one metre without collecting a mouse and verify distance contributes one point.
- [ ] Collect grass repeatedly and verify each outcome can appear: magnet, invincible, double score, and slow miss/blank effect.
- [ ] While double score is active, collect a mouse and verify its points double while distance points do not.
- [ ] Verify the magnet pulls nearby mouse toys toward the cat.
- [ ] Verify invincibility prevents collision damage and that effects expire.
- [ ] Reach score 1,000 and verify the background changes from the daytime home to the outside area and difficulty increases.
- [ ] Reach score 2,500 and verify the background changes to the nighttime home and difficulty increases again.
- [ ] Adjust music and effects sliders independently, toggle mute, reload, and confirm the settings persist locally.

### Offline and resume behavior

- [ ] Start a browser-local run and confirm a saved snapshot is refreshed during play (about once per second) and on page exit.
- [ ] Reload or reopen the app during an active local run and confirm **이어하기** restores the cat and game state.
- [ ] Choose **새 게임** from the resume prompt and confirm the previous local run is discarded.
- [ ] Confirm a local run remains available without a 24-hour expiry, then finish a run and confirm its active snapshot is cleared.
- [ ] Clear/replace the browser's local storage and confirm browser-local active progress and records are not shared or recoverable from another browser.
- [ ] Optional authenticated-backend check: verify its network/reconnect and server resume behavior independently of browser-local mode.

### Results and leaderboard

- [ ] Finish a browser-local run and confirm its result and personal records appear in that browser without claiming a server rank or shared leaderboard entry.
- [ ] Finish another local run and confirm personal scores persist after reload in the same browser.
- [ ] Confirm the local leaderboard displays only local personal records and does not expose another browser's scores.
- [ ] Optional authenticated-backend check: finish valid server runs and verify server leaderboard behavior below.
- [ ] (Authenticated backend only) Finish a valid server run and verify the result screen shows score, distance, mouse count, personal-best status, and rank.
- [ ] (Authenticated backend only) Finish a better run and verify the personal best is replaced; finish a lower run and verify it does not replace the best.
- [ ] (Authenticated backend only) Add at least 12 users with best scores and verify the dashboard shows no more than 10 entries.
- [ ] (Authenticated backend only) Create equal-score entries and verify ordering is score descending, distance descending, then earliest achievement time.
- [ ] (Authenticated backend only) Confirm duplicate nicknames remain separate because the full email is visible.
- [ ] Enter nickname/email-like strings such as `<img src=x onerror=alert(1)>` and verify they appear as text, never executable HTML.
- [ ] Force a completion failure and verify the local result shows a retry action without claiming a saved rank.
- [ ] Choose Restart from the result screen and verify character selection opens so a new cat can be chosen.

### Responsive and error boundaries

- [ ] Resize to a narrow viewport and verify the 16:9 shell, cat cards, result screen, and leaderboard remain usable without clipped controls.
- [ ] Submit malformed JSON, an oversized request, an invalid cat ID, and an invalid event type; verify stable error codes/messages and no stack or filesystem path leakage.
- [ ] Attempt to access another user’s run events, snapshot, completion, and abandon endpoints; verify each request is rejected.
- [ ] Visit an unknown `/api/*` route and verify JSON `{ error: { code, message, retryable } }` is returned.

<a id="public-render-deployment"></a>

### Public Render deployment

Use the HTTPS URL assigned by Render after the Blueprint is connected and deployed. A first request after idle can take about a minute while the Free service starts; retry once before diagnosing a failure.

- [ ] Open the assigned HTTPS URL in a private/incognito window and confirm the game choice screen renders.
- [ ] Choose local play, complete a run, and confirm the personal record appears in the same browser.
- [ ] Open the URL in a separate browser profile and confirm its personal records are independent; there is no server-shared leaderboard.
- [ ] Open `https://<service-name>.onrender.com/api/health` and confirm HTTP 200 JSON with `ok: true`.
- [ ] Confirm the service can wake from idle and the game remains playable after the loading delay.

## 향후 저장소 마이그레이션 참고

Cosmos DB 마이그레이션은 현재 로컬 구현 범위에 포함되지 않습니다. 런타임은 SQLite를 사용하며 향후 저장소 기반 마이그레이션을 진행할 수 있도록 구성되어 있습니다.
