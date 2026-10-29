# Cat Runner 개발 안내

Cat Runner는 HTML, CSS, 브라우저 JavaScript로 동작하는 정적 게임입니다. 방문자는 GitHub Pages 주소를 열면 되며 Node.js를 설치할 필요가 없습니다.

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

## 브라우저 수동 확인

공개 게임 주소를 Chrome 또는 Edge에서 열어 다음 흐름을 확인합니다.

- 첫 화면에서 로컬 플레이를 누르면 고양이 선택이 열립니다.
- 여섯 고양이 미리보기와 기본 선택, 이동/점프/미끄러지기, 일시정지가 동작합니다.
- 진행 중 새로고침 후 저장된 달리기를 이어가거나 새 게임으로 바꿀 수 있습니다.
- 게임 종료 후 점수와 개인 기록이 이 브라우저에 저장되고 개인 기록 화면에서 보입니다.
- 저장소가 차단된 경우에도 게임은 계속되고 저장 실패 안내가 보입니다.
- 화면을 좁게 조절해도 카드와 결과 화면의 버튼을 사용할 수 있습니다.
- 개발자 도구 Network에서 페이지, 스크립트, 폰트, 이미지가 저장소 경로 아래에서 로드되고 API 요청이 발생하지 않는지 확인합니다.
- Chrome 또는 Edge DevTools Performance/Rendering 도구에서 프레임 끊김이 있는지 확인합니다. 렌더 성능 목표와 비교 방법은 계획 Task T04에 기록되어 있습니다.
