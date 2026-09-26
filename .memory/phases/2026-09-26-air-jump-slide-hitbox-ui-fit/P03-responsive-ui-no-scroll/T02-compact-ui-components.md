# Task: T02 무스크롤 폰트·카드·표 축소

## Status: done

## Goal

모든 UI 화면의 제목·본문·표·카드 여백을 축소하고, 캐릭터 선택과 개인 기록/순위표의 모든 내용을 보존한 채 320px에서도 잘림과 가로 스크롤이 없도록 만든다.

## Decision Summary

- 제목 최소 18px, 본문 최소 11px, 표 최소 10px, 카드 padding 최소 10px.
- 표 열과 데이터는 삭제하지 않고 `table-layout: auto` 및 wrap으로 처리한다.
- 320px 캐릭터 선택은 1열, 이미지 높이 48px, 장단점·5개 능력치 모두 유지한다.

## Implementation

### I01. 공통 UI 타이포그래피와 카드 축소

- Related Files:
  - `public/styles.css` :: global UI typography, `.flow-card`, `.wide-card`, headings/buttons; modify
  - `public/js/ui/text-fitting.js` :: `fitSingleLineText`; read-only unless min-size contract needs adjustment

#### Details

- `#screen-root h1`, `.flow-card h1`, `.fit-title`의 clamp 하한을 18px로 설정한다. 한 줄이 필요한 제목만 `fitSingleLineText`가 줄이고 설명은 자연스럽게 wrap한다.
- 본문/label/small/helper text와 button/input text의 하한을 11px로 둔다. Pretendard family와 weight hierarchy는 유지한다.
- `.flow-card`와 `.wide-card` padding/gap 하한을 10px로 줄이고 section margin을 viewport 높이에 맞춰 축소한다.
- 제목은 `line-height`와 `max-width`를 지정해 잘리지 않게 하며 `overflow: visible`을 유지한다. 결과·일시정지·로그인·닉네임 화면도 동일 공통 규칙을 사용한다.

### I02. 표와 기록 화면의 가로/세로 overflow 제거

- Related Files:
  - `public/styles.css` :: `.leaderboard-table`, `.personal-records-table`, `.current-result`, table media rules; modify
  - `public/js/ui/leaderboard.js` :: table rendering; inspect/modify only if wrapper class is required
  - `public/js/ui/personal-records.js` :: table rendering; inspect/modify only if wrapper class is required

#### Details

- `.leaderboard-table`는 `width: 100%`, `table-layout: auto`, `font-size: max(10px, ...)`, `white-space: normal`, `overflow-wrap: anywhere`를 사용한다.
- 모든 th/td의 word breaking과 padding을 조정해 긴 날짜·거리·정확도·방금 기록 문장이 셀에서 wrap되게 한다.
- 순위·점수·거리·정확도·플레이 날짜와 방금 기록 영역은 삭제하지 않으며 열을 숨기는 media query를 추가하지 않는다.
- 별도 horizontal scroll wrapper가 있으면 제거하거나 overflow visible로 조정한다. DOM 변경이 필요할 때만 두 렌더러에 동일 class를 추가한다.

### I03. 캐릭터 선택 카드 320px 레이아웃

- Related Files:
  - `public/styles.css` :: `.cat-grid`, `.cat-card`, `.cat-preview`, `.cat-stat-grid`, max-width 760/500/360 media rules; modify
  - `public/js/ui/cat-card.js` :: `renderCatCard`; read-only unless semantic class needed
  - `public/js/ui/character-select.js` :: `renderCharacterSelect`; read-only unless layout wrapper needed

#### Details

- 320px~500px에서는 `.cat-grid { grid-template-columns: 1fr; }`를 유지한다.
- `.cat-card` height/min-height, gap, padding을 줄이고 `.cat-preview { height: 48px; }`로 조정한다.
- 이미지·이름·장점·약점·점프력/속도/체력/아이템 지속시간/자석 범위의 5 stats를 모두 렌더링하며 `display:none`으로 숨기지 않는다.
- stat row는 2열 또는 읽을 수 있는 압축 grid로 재배치하되 label과 1~5 등급을 남긴다. 선택 border, start button, 설명/로컬 안내 문구도 유지한다.

## Acceptance Criteria

- [ ] 320px 폭에서 제목·본문·버튼·표 글자가 잘리지 않는다.
- [ ] 개인 기록표와 순위표의 모든 열/데이터가 유지되고 가로 스크롤이 없다.
- [ ] 캐릭터 카드에 이미지·장단점·5개 능력치가 모두 보인다.
- [ ] UI 카드와 표가 viewport 높이 안에 들어온다.

## Validation

- `node --test --test-concurrency=1 test/font-layout.test.js test/text-fitting.test.js test/leaderboard.test.js`
- 브라우저 320x640에서 character-select/personal-records/leaderboard를 확인하고 document의 scrollWidth와 clientWidth가 같은지 검증

## Commit Message

```text
fix(ui): compact typography cards and record tables

Plan: 2026-09-26-air-jump-slide-hitbox-ui-fit
Phase: P03-responsive-ui-no-scroll
Task: T02-compact-ui-components

- Reduce UI typography and card spacing without clipping
- Preserve character stats and record table columns without scroll
```

## Progress

- [x] 구현 완료
- [x] 검증 통과 (`--test-isolation=none` 사용)
- commit: pending
