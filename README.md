# Cat Runner

Cat Runner는 브라우저에서 즐기는 무한 달리기 게임입니다. 여섯 고양이 중 하나를 골라 실내 장애물을 뛰어넘고, 낮은 장애물 아래로 미끄러져 지나가며, 쥐 장난감을 모으세요. 브라우저 로컬 모드로 바로 플레이할 수 있습니다. 현재 화면에서는 Microsoft Entra 로그인을 사용할 수 없습니다.

## 준비물

- Node.js 22 또는 24 LTS
- npm

## 로컬에서 실행하기

```powershell
npm.cmd install
```

로컬 플레이를 실행하는 데 `.env` 파일이나 계정 설정은 필요하지 않습니다. 앱을 실행한 뒤 <http://localhost:3000>을 여세요. 고양이 선택 화면으로 넘어가려면 **로컬로 플레이**를 선택합니다. **로그인 (개발 예정)**을 누르면 개발 중 안내가 표시됩니다. 로그인 기능은 아직 제공되지 않습니다.

서버를 실행합니다.

```powershell
npm.cmd start
# or, during development:
npm.cmd run dev   # development mode with Node watch
```

<http://localhost:3000>을 여세요. 기본 데이터베이스 경로는 `data/cat-runner.sqlite`입니다. 로컬 진행 기록을 초기화하려면 서버를 중지한 뒤 데이터베이스 파일을 삭제하세요.

```powershell
Remove-Item data/cat-runner.sqlite, data/cat-runner.sqlite-shm, data/cat-runner.sqlite-wal -ErrorAction SilentlyContinue
```

다음에 서버를 시작하면 데이터베이스가 자동으로 다시 만들어집니다. 이 작업은 서버 측 실행 기록, 세션, 리더보드 데이터만 삭제합니다. 브라우저 로컬 플레이는 진행 중인 게임과 개인 기록을 해당 브라우저의 로컬 저장소에 보관합니다. 서버 계정을 만들거나 다른 사용자와 기록을 공유하지 않습니다. 브라우저 데이터를 지우면 이 로컬 기록도 삭제됩니다.

로컬 `.env` 파일에 인증 설정이 있다면, 인증 설정별 테스트가 예상한 환경에서 실행되도록 인증 관련 환경 변수를 비운 뒤 테스트하세요.

```powershell
$env:ENABLE_GUEST_MODE = "false"
$env:ENTRA_CLIENT_ID = ""
$env:ENTRA_CLIENT_SECRET = ""
$env:ENTRA_TENANT_AUTHORITY = ""
$env:ENTRA_REDIRECT_URI = ""
npm.cmd test
```

## 선택 사항: Microsoft Entra ID 백엔드

기존 인증 백엔드는 개발용으로 계속 사용할 수 있지만, 현재 게임 화면에는 정상 동작하는 로그인 기능이 없습니다. 향후 인증 기능을 위해 Entra 설정을 준비할 수는 있지만 필수는 아닙니다. `.env`, 클라이언트 암호, 액세스 토큰, 개인 이메일 주소를 저장소에 커밋하지 마세요.

Azure 포털에서 다음 설정으로 앱 등록을 만듭니다.

1. 지원되는 계정 유형: 모든 조직 디렉터리의 계정(다중 테넌트).
2. 플랫폼: Web.
3. 리디렉션 URI: `http://localhost:3000/auth/callback`.
4. 클라이언트 암호를 만들고 값은 `.env` 또는 로컬 암호 관리자에만 보관합니다.

`.env.example`을 `.env`로 복사하고 다음 값을 설정합니다.

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

`ENABLE_GUEST_MODE`는 기존 게스트 인증 API만 활성화합니다. 브라우저 로컬 플레이에는 필요하지 않으며, 화면에 게스트 로그인 버튼을 추가하지도 않습니다. 해당 API를 테스트하려면 `.env`에서 개발 전용 플래그를 설정하세요.

```dotenv
ENABLE_GUEST_MODE=true
```

이 API는 `.local.invalid` 이메일 주소를 사용하는 임시 계정을 만들 수 있습니다. `NODE_ENV=production`이면 게스트 모드가 자동으로 비활성화됩니다. 공개 배포에서는 켜지 마세요.

Entra 값을 설정하지 않아도 서버는 게임 화면을 제공합니다. 화면의 로그인 동작은 개발 안내를 표시하지만, 보호된 API를 호출하려면 유효한 인증과 설정이 필요합니다.

## 게임 방법과 규칙

- `W`: 점프합니다. 공중에서 다시 누르면 한 번 더 점프할 수 있습니다.
- `S`: 누르고 있는 동안 바닥에서 미끄러집니다.
- `P` 또는 화면의 일시정지 버튼: 게임을 멈추거나 다시 진행합니다.
- 쥐 장난감을 모으면 개당 10점을 얻고, 이동 거리는 완료한 1미터마다 1점으로 계산됩니다.
- 점수 2배 효과는 쥐 장난감 점수에만 적용되며 이동 거리 점수는 두 배가 되지 않습니다.
- 풀을 밟으면 자석, 무적, 점수 2배, 속도 감소 중 하나의 효과가 같은 확률로 발동합니다.
- 점수 1,000점에서 야외 구역으로, 2,500점에서 밤의 집 구역으로 이동합니다. 구역이 바뀌면 배경과 난이도도 달라집니다.
- 장애물에 부딪히면 체력이 줄어듭니다. 화면의 하트 수는 고른 고양이의 체력에 따라 달라지며, 체력이 0이 되면 게임이 끝납니다.

### 고양이 선택

게임을 시작할 때마다 고양이를 새로 선택합니다. 선택할 수 있는 고양이는 검은 고양이(black), 흰 고양이(white), 삼색 고양이(calico), 치즈 고양이(cheese), 고등어 고양이(mackerel), 카오스(chaos)입니다. 고양이마다 이동 속도, 점프력, 체력, 아이템 지속 시간, 자석 범위가 다릅니다. 각 능력치는 캐릭터 선택 화면에서 확인할 수 있습니다.

### 로컬 기록과 서버 리더보드

브라우저 로컬 모드에서 완료한 점수는 해당 브라우저에만 개인 기록으로 저장되며 서버에 업로드되거나 다른 사람과 공유되지 않습니다. 서버 리더보드는 선택 사항인 인증 백엔드에 속합니다. 로컬 게임이 진행 중이면 약 1초마다 그리고 페이지를 떠날 때 진행 상태를 저장합니다. 게임을 다시 열면 **이어서 하기** 또는 **새 게임**을 선택할 수 있습니다. 로컬 진행 상태는 시간 제한 없이 보관되며, 게임을 완료하거나 직접 버리면 삭제됩니다.

## Render에 공개 배포하기

Cat Runner는 Render Blueprint로 관리하는 Node 웹 서비스로 설정되어 있으며, 싱가포르 지역의 Free 요금제를 사용합니다. 배포하려면 Render에 로그인하고 GitHub에서 `jeong-sodam/cat_runner` 저장소에 접근하도록 연결한 뒤, 저장소 루트의 `render.yaml`을 사용해 새 Blueprint를 만듭니다. 서비스 설정을 검토하고 Blueprint를 적용하세요. 빌드 명령은 `npm ci`, 시작 명령은 `npm start`, 상태 확인 경로는 `/api/health`입니다. `main` 브랜치의 배포는 연결된 CI 검사가 통과한 뒤 시작됩니다.

첫 배포가 끝나면 Render가 할당한 HTTPS 주소를 복사하세요. 예를 들어 서비스 주소는 `onrender.com` 도메인을 사용할 수 있습니다. 실제 주소는 Render가 할당하므로 이 저장소에는 고정되어 있지 않습니다. 페이지, 상태 확인 주소, 로컬 기록을 검증하려면 [공개 Render 배포 승인 체크리스트](docs/manual-acceptance.md#public-render-deployment)를 따르세요.

방문자는 최신 브라우저만 있으면 됩니다. 할당된 URL을 열고 로컬 플레이를 선택하세요. VS Code, Node.js 설치, 다운로드, 계정이 필요하지 않습니다. 각 브라우저는 개인 점수와 진행 중인 게임 데이터를 자체적으로 보관합니다. 기록은 다른 브라우저나 기기와 동기화되지 않으며, 이 배포에서는 공유 리더보드를 제공하지 않습니다.

Render Free 서비스는 15분 동안 요청이 없으면 절전 상태가 됩니다. 다음 요청을 받으면 서비스가 시작되는 동안 약 1분이 걸릴 수 있습니다. SQLite 데이터를 포함한 서버 파일은 임시 저장 공간에 있으므로 서비스가 절전, 재시작 또는 재배포될 때 사라질 수 있습니다. 로컬 플레이의 개인 기록은 방문자의 브라우저에 저장됩니다. 플랫폼의 최신 제한 사항은 [Render Free 인스턴스 제한](https://render.com/docs/free)을 확인하세요.

## 수동 확인

반복 가능한 전체 게임플레이 및 복구 체크리스트는 [docs/manual-acceptance.md](docs/manual-acceptance.md)를 참고하세요. 화면 개편 스모크 테스트에서는 <http://localhost:3000>에서 다음 항목을 확인합니다.

- 새로 열었을 때 첫 번째 일시정지 동작 전에는 일시정지 창이 보이지 않습니다. `P`와 화면의 일시정지 버튼으로 멈춤/재개를 전환할 수 있습니다.
- 인증, 닉네임, 캐릭터 선택, 일시정지, 결과, 리더보드 화면의 문구가 모두 한국어로 표시됩니다.
- 여섯 고양이 카드에 서로 다른 미리보기가 표시됩니다. 미리보기 요청이 차단되거나 실패해도 카드를 선택할 수 있습니다.
- 게임 중 `W`를 누르면 점프하고, `S`를 누르면 미끄러집니다. 진행에 따라 세 구역의 배경이 바뀝니다.
- 브라우저 개발자 도구에서 `/assets/cat-runner/` 이미지 요청 하나를 차단해도 벡터 대체 그래픽으로 게임을 계속할 수 있습니다.
- 화면 너비가 약 500px일 때도 조작 버튼에 접근할 수 있고, 넓은 패널과 표를 가로로 스크롤할 수 있습니다.

자동 통합 및 보안 검사는 다음 명령으로 실행할 수 있습니다.

```powershell
node --test test/integration.test.js test/security-regression.test.js
npm.cmd test
```

클라우드 Cosmos DB 마이그레이션은 로컬 구현 범위에 포함되지 않습니다. 현재 런타임은 SQLite를 사용하며, 향후 저장소 기반 마이그레이션을 진행할 수 있도록 구성되어 있습니다.
