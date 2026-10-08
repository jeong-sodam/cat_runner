# Cat Runner

Cat Runner is a browser endless runner. Choose one of six cats, jump over indoor obstacles, slide under hazards, and collect mouse toys. You can play immediately in browser-local mode; Entra sign-in is not yet available in the UI.

## Prerequisites

- Node.js 22 or 24 LTS
- npm

## Local setup

```powershell
npm.cmd install
```

No `.env` file or identity configuration is needed to run local play. Start the app and open <http://localhost:3000>. Choose **로컬로 플레이** to continue to cat selection. **로그인** currently shows a development notice; authentication is planned, not available through the UI yet.

Start the server:

```powershell
npm.cmd start
# or, during development:
npm.cmd run dev   # development mode with Node watch
```

Open <http://localhost:3000>. The default database is `data/cat-runner.sqlite`. Stop the server before resetting local progress, then remove the database files:

```powershell
Remove-Item data/cat-runner.sqlite, data/cat-runner.sqlite-shm, data/cat-runner.sqlite-wal -ErrorAction SilentlyContinue
```

The database is recreated automatically on the next start. This deletes server-side runs, sessions, and leaderboard data only. Browser-local play stores active runs and personal results in that browser's local storage; it does not create a server identity or share records with other users. Clearing browser data removes those local records.

If you have a local `.env` with auth settings, run tests with auth-related environment values cleared so configuration-specific tests keep their expected setup:

```powershell
$env:ENABLE_GUEST_MODE = "false"
$env:ENTRA_CLIENT_ID = ""
$env:ENTRA_CLIENT_SECRET = ""
$env:ENTRA_TENANT_AUTHORITY = ""
$env:ENTRA_REDIRECT_URI = ""
npm.cmd test
```

## Optional Microsoft Entra ID backend

The legacy authenticated backend remains available for development, but the current game UI does not offer working sign-in. Entra configuration is optional and can be prepared for future authenticated use. Never commit `.env`, client secrets, access tokens, or personal email addresses.

Create an app registration in the Azure portal with these settings:

1. Supported account types: accounts in any organizational directory (multitenant).
2. Platform: Web.
3. Redirect URI: `http://localhost:3000/auth/callback`.
4. Create a client secret and keep its value only in `.env` or a local secret manager.

Copy `.env.example` to `.env` and set:

```dotenv
PORT=3000
DATABASE_PATH=data/cat-runner.sqlite
SESSION_SECRET=use-a-long-random-local-value
ENTRA_CLIENT_ID=your-application-client-id
ENTRA_CLIENT_SECRET=your-local-client-secret
ENTRA_TENANT_AUTHORITY=https://login.microsoftonline.com/organizations
ENTRA_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Legacy guest API mode

`ENABLE_GUEST_MODE` only enables the legacy guest-auth API. It is not needed for browser-local play and does not add a guest-login entry to the UI. To test that API, set this development-only flag in `.env`:

```dotenv
ENABLE_GUEST_MODE=true
```

The API can create a temporary account with a `.local.invalid` email. Guest mode is automatically disabled when `NODE_ENV=production`; never enable it on a public deployment.

Without Entra values, the server still starts and serves the game shell. The UI's login action shows a development notice, while protected API calls still require valid authentication/configuration.

## Game rules

- `W`: jump. Press again in the air for the second jump.
- `S`: slide while grounded.
- `P` or the pause button: pause/resume.
- Mouse toys are worth 10 points each. Distance adds one point per completed metre.
- Double-score doubles mouse-toy points, not distance points.
- Grass has four equally likely outcomes: magnet, invincible, double score, or slow miss (“blank” effect).
- Zone changes happen at score 1,000 (outside) and 2,500 (home at night); each zone raises difficulty and changes the background.
- Collisions reduce health. Three hearts are derived from the health value; zero health ends the run.

### Cats

Each run starts with a fresh cat choice. The six available cats are black, white, calico, cheese, mackerel, and chaos. Their visible modifiers trade off speed, jump, slide, item duration, and health; the character-selection screen is the source of the current values.

### Local scores and server leaderboard

In browser-local mode, completed scores are stored only in that browser and shown as personal records; they are not uploaded or shared. The server leaderboard belongs to the optional authenticated backend. When a local run is active, its snapshot is saved about once per second and on page exit. Reopening the game offers **이어하기** or **새 게임**; local progress has no time-based expiry and is cleared when completed or discarded.

## Manual acceptance

Use [docs/manual-acceptance.md](docs/manual-acceptance.md) for the complete repeatable gameplay and recovery checklist. For the visual refresh smoke test, verify the following at <http://localhost:3000>:

- A fresh run opens without a visible pause modal; `P` and the pause button toggle pause/resume.
- All visible screen copy is Korean, including auth, nickname, character, pause, result, and leaderboard screens.
- All six cat cards show distinct previews and remain selectable if one preview request is blocked or fails.
- `W` shows jump, `S` shows slide, and the three zones visibly change as the run progresses.
- Blocking one `/assets/cat-runner/` image in browser DevTools still leaves the run playable through the vector fallback.
- At a narrow viewport around 500px, actions remain reachable and wide panels/tables can scroll.

Automated integration and security coverage can be run with:

```powershell
node --test test/integration.test.js test/security-regression.test.js
npm.cmd test
```

Cloud Cosmos DB migration is not part of the local implementation; the current runtime uses SQLite and remains ready for a future repository-backed migration.
