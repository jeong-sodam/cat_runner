# Cat Runner

고양이를 골라 장애물을 피하고 쥐 장난감을 모으는 브라우저 러너 게임입니다.

## 준비물

- Node.js 24 LTS와 npm
- Windows x64 또는 Intel/Apple Silicon Mac

위 환경에서는 Python이나 C/C++ 빌드 도구를 따로 설치하지 않아도 됩니다.

## 설치하고 실행하기

### Windows (PowerShell or Git Bash)

```
git clone https://github.com/jeong-sodam/cat_runner.git
cd cat_runner
npm.cmd install
npm.cmd start
```

### macOS 터미널

```sh
git clone https://github.com/jeong-sodam/cat_runner.git
cd cat_runner
npm install
npm start
```

서버가 시작되면 브라우저에서 <http://localhost:3000>을 여세요. 로컬 플레이에는 `.env` 파일, 계정, 로그인이 필요하지 않습니다.

## 설치 중 문제가 생기면

- `ENOENT` 오류에 `package.json`이 언급되면 저장소 폴더 안에서 명령을 실행하는지 확인하세요. `git clone` 뒤 `cd cat_runner`로 이동하면 됩니다. Git Bash 프롬프트가 `~`로만 표시되면 아직 홈 폴더에 있을 수 있습니다.
- 지원 대상인 Windows x64 또는 Mac에서 Node.js 24를 사용 중인데 C++ 빌드 도구 오류가 나오면, Python이나 컴파일러를 설치하지 말고 npm이 출력한 전체 디버그 로그 경로와 `node --version`, 운영체제 및 CPU 종류를 확인해 공유하세요. 설치된 SQLite 사전 빌드를 사용하지 못한 원인을 확인할 수 있습니다.

## 게임 방법

- `W`: 점프합니다. 공중에서 한 번 더 점프할 수 있습니다.
- `S`: 누르고 있는 동안 미끄러집니다.
- `P`: 게임을 멈추거나 다시 진행합니다.
- 장애물을 피하고 쥐 장난감을 모아 오래 달리며 높은 점수를 노리세요.
- 쥐 장난감은 개당 10점, 이동 거리는 1미터마다 1점입니다. 점수 2배 효과는 쥐 점수에만 적용됩니다.
- 풀 아이템은 자석, 무적, 점수 2배, 속도 감소 중 하나의 효과를 줍니다.

## 고양이 선택

각 고양이의 능력치는 다릅니다. 주요 장점과 약점을 보고 골라 보세요.

| 고양이 | 장점 | 약점 |
| --- | --- | --- |
| 검정 | 이동 속도 | 아이템 지속 시간 |
| 하양 | 아이템 지속 시간 | 이동 속도 |
| 삼색 | 체력 | 이동 속도 |
| 치즈 | 균형 잡힌 능력 | 뚜렷한 약점 없음 |
| 고등어 | 이동 속도 | 아이템 지속 시간 |
| 카오스 | 이동 속도 | 체력 |

개발, 테스트, Entra 설정, 공개 배포와 전체 수동 확인 방법은 [개발자 안내](docs/development.md)를 참고하세요.
