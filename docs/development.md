# 썬더런 (Thunder Run) 개발 안내

썬더런 (Thunder Run)은 HTML, CSS, 브라우저 JavaScript로 동작하는 정적 게임입니다. 방문자는 GitHub Pages 주소를 열면 되며 Node.js를 설치할 필요가 없습니다.

## 자동 테스트

개발 PC와 GitHub Actions는 Node.js 24를 사용합니다. 저장소 루트에서:

Windows PowerShell:

```powershell
npm.cmd ci
npm.cmd test
```

macOS/Linux:

```sh
npm ci
npm test
```

프로젝트에는 게임 기능을 묶는 Node 의존성이 없습니다. Node 24는 Node 내장 테스트 러너를 실행하기 위한 개발 도구입니다.

## GitHub Pages 배포 설정

저장소 관리자는 최초 한 번 GitHub 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다. 이후 `main`에 푸시하면 4개 운영체제의 Node 24 테스트가 전부 성공한 뒤 `public/` 디렉터리가 자동 배포됩니다. 테스트가 실패하거나 Pull Request 이벤트이면 배포 작업은 실행되지 않습니다.

배포 주소는 <https://jeong-sodam.github.io/cat_runner/>입니다. 페이지 소스는 빌드 과정 없이 `public/`에서 직접 제공됩니다.

## 브라우저 수동 확인

공개 게임 주소 <https://jeong-sodam.github.io/cat_runner/>를 Chrome 또는 Edge에서 열어 다음 흐름을 확인합니다.

- 첫 화면에서 로컬 플레이를 누르면 고양이 선택이 열립니다.
- 여섯 고양이 미리보기와 기본 선택, 이동/점프/미끄러지기, 일시정지가 동작합니다.
- 진행 중 새로고침 후 저장된 달리기를 이어가거나 새 게임으로 바꿀 수 있습니다.
- 게임 종료 후 점수와 개인 기록이 이 브라우저에 저장되고 개인 기록 화면에서 보입니다.
- 저장소가 차단된 경우에도 게임은 계속되고 저장 실패 안내가 보입니다.
- 화면을 좁게 조절해도 카드와 결과 화면의 버튼을 사용할 수 있습니다.
- 개발자 도구 Network에서 페이지, 스크립트, 폰트, 이미지가 저장소 경로 아래에서 로드되고 API 요청이 발생하지 않는지 확인합니다.
- Chrome 또는 Edge DevTools **Performance**에서 녹화를 시작하고 플레이 직후 첫 10초와 3분 이상 진행한 구간을 각각 기록합니다. Frames 트랙의 평균 프레임 속도와 16.7ms를 넘긴 긴 프레임, Main 트랙의 스크립트·그리기 시간을 확인합니다. 60 FPS에 가까우며 장시간 눈에 띄는 끊김이 없어야 합니다. 같은 PC와 브라우저에서 비교해야 하며, 성능 측정은 기기 부하에 따라 달라질 수 있습니다.
