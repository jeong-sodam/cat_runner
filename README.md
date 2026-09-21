# Cat Runner

Cat Runner is a browser endless runner. Choose one of six cats, jump over indoor obstacles, slide under hazards, collect mouse toys, and compare personal-best scores on the authenticated leaderboard.

## Prerequisites

- Node.js LTS (20 or newer)
- npm
- A Microsoft Entra ID app registration for sign-in during local development

## Local setup

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and fill in the Entra values described below. Never commit `.env`, client secrets, access tokens, or personal email addresses.

Run the checks and start the server:

```powershell
npm test
npm run dev       # development mode with Node watch
# or
npm start
```

Open <http://localhost:3000>. The default database is `data/cat-runner.sqlite`. Stop the server before resetting local progress, then remove the database files:

```powershell
Remove-Item data/cat-runner.sqlite, data/cat-runner.sqlite-shm, data/cat-runner.sqlite-wal -ErrorAction SilentlyContinue
```

The database is recreated automatically on the next start. This deletes local runs, sessions, and leaderboard data only.

## Microsoft Entra ID

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

### Guest play mode

For local gameplay without Entra credentials, set this development-only flag in `.env`:

```dotenv
ENABLE_GUEST_MODE=true
```

Restart the server, open the game, and choose **게스트로 플레이**. A temporary local account is created with a `.local.invalid` email and follows the same run, score, resume, and leaderboard flow. Guest mode is automatically disabled when `NODE_ENV=production`; never enable it on a public deployment.

If the Entra values are missing, the server still starts and serves the game shell. Sign-in and protected API calls show a configuration/authentication error instead of exposing a secret or stack trace.

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

### Scores and leaderboard

The server replays the event stream and calculates the authoritative result. Only each user’s best score is stored. Leaderboard ties are ordered by score descending, distance descending, and earliest achievement time. The dashboard shows the top ten and intentionally displays the full email address, which is a confirmed product decision.

## Manual acceptance

Use [docs/manual-acceptance.md](docs/manual-acceptance.md) for the complete repeatable gameplay and recovery checklist. Automated integration and security coverage can be run with:

```powershell
node --test test/integration.test.js test/security-regression.test.js
npm test
```

Cloud Cosmos DB migration is not part of the local implementation; the current runtime uses SQLite and remains ready for a future repository-backed migration.
