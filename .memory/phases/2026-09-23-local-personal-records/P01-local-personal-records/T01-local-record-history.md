# Task: T01 Local Record History and Rank

## Status: done

## Goal

로컬 플레이 기록을 상위 5개만 잃지 않고 전체 이력으로 저장하며, 점수순으로 정렬된 최고 5개와 방금 기록의 전체 개인 순위를 계산할 수 있는 저장소 API를 제공한다. 기존 `LOCAL_BEST_KEY` 및 `LOCAL_SCORES_KEY` 데이터가 있는 브라우저에서도 기록을 잃지 않고 새 이력 형식으로 마이그레이션한다.

## Decision Summary

- 같은 브라우저의 `localStorage`에 모든 로컬 기록을 유지한다.
- 같은 점수에서는 `achievedAt`이 이른 기록이 먼저 오도록 정렬한다.
- 화면용 최고 기록은 정렬된 전체 이력의 앞 5개이며, 5위 밖 기록도 `rank`를 계산한다.
- 기록 초기화 API나 UI는 추가하지 않는다.

## Implementation

### I01. 전체 이력 저장 모델과 호환 마이그레이션

- Related Files:
  - `public/js/sync/local-run-store.js` :: `LOCAL_*_KEY` 상수, `normalizeScoreRecord`, `compareScoreRecords`, `createLocalRunStore`; modify
  - `test/run-resume.test.js` :: 로컬 저장소 테스트; modify/add

#### Details

- **Storage keys**:
  - `LOCAL_HISTORY_KEY = "cat-runner:local-history"`를 새 전체 이력 키로 추가한다.
  - `LOCAL_SCORES_KEY = "cat-runner:local-scores"`는 기존 소비자와 이전 버전 호환을 위해 유지한다. 새 저장 시 정렬된 상위 5개 캐시를 기록하거나, 읽기 시 전체 이력의 상위 5개로 동기화한다.
  - `LOCAL_BEST_KEY`와 `LOCAL_LAST_RESULT_KEY`는 기존 키/API 호환을 위해 유지한다.
- **Record schema**: `LocalScoreRecord`는 다음 필드를 가진다.
  - `score: number`
  - `distanceM: number`
  - `mouseCount: number`
  - `rhythmAccuracy: number`
  - `catId: string` (기본값 `"black"`)
  - `achievedAt: number` (Unix milliseconds)
- **Required store API**:
  ```js
  getLocalHistory() -> LocalScoreRecord[]
  getLocalScores() -> LocalScoreRecord[] // getLocalHistory().slice(0, 5)
  getLocalRank(record) -> number | null
  saveLocalResult(record) -> {
    saved: boolean,
    ranked: boolean, // rank <= 5
    rank: number | null,
    record: LocalScoreRecord,
    entries: LocalScoreRecord[], // top five
    totalEntries: number,
  }
  ```
- `normalizeScoreRecord`는 숫자 필드의 비정상 값을 0으로 정규화하고 기존처럼 `catId`/`achievedAt` 기본값을 적용한다.
- `compareScoreRecords`는 점수만 우선 비교한다. 점수가 같으면 `achievedAt`이 작은 기록을 먼저 둔다. 거리로 동점 순서를 바꾸지 않는다.
- `getLocalHistory()` 읽기 순서:
  1. `LOCAL_HISTORY_KEY`가 유효한 배열이면 모든 유효 레코드를 정규화·정렬해 반환한다.
  2. 새 키가 없으면 기존 `LOCAL_SCORES_KEY`의 배열을 읽어 이력으로 승격한다.
  3. 기존 `LOCAL_BEST_KEY`만 있으면 해당 레코드를 이력에 넣고 새 키를 쓴다.
  4. JSON이 깨졌거나 배열이 아니면 해당 값을 안전하게 버리고 빈 이력으로 처리한다.
- `saveLocalResult`는 새 레코드를 전체 이력에 추가하고 `LOCAL_HISTORY_KEY`에 저장한다. 성공 후 `LOCAL_SCORES_KEY`에는 상위 5개 캐시를 저장한다. 전체 순위는 저장된 이력 배열에서 새 레코드의 정렬 위치로 계산하므로 5위 밖도 `rank`를 가진다.
- `getLocalRank(record)`는 `achievedAt`을 포함한 정규화된 레코드 식별값을 기준으로 전체 이력에서 해당 기록의 위치를 찾아 1부터 반환한다. 찾지 못하면 `null`을 반환한다.
- `saveLastResult`/`getLastResult`는 기존처럼 최신 기록을 별도 보존한다. 최신 기록을 읽을 때 순위가 저장되어 있지 않아도 `getLocalRank`로 다시 계산할 수 있게 한다.
- 기존 `saveLocalBest`, `getLocalBest`, `clearLocalScores`, `clearLocalBest`는 공개 API를 깨지 않는다. `clearLocalScores`/`clearLocalBest`는 새 전체 이력 키와 기존 상위 5개 키를 함께 정리한다.
- `localStorage` 쓰기 예외 시 `saved: false`를 반환하고 메모리 상태만 성공으로 가장하지 않는다.

### I02. 저장소 단위 검증 테스트

- Related Files:
  - `test/run-resume.test.js` :: `local score history...`, `local score history migrates...` 및 신규 테스트; modify

#### Details

- 6개 이상의 기록을 저장했을 때 `getLocalHistory()`는 6개 이상을 보존하고 `getLocalScores()`는 상위 5개만 반환하는지 검증한다.
- 점수가 같은 두 기록은 `achievedAt`이 이른 기록이 먼저 오고, 거리 값이 순서를 바꾸지 않는지 검증한다.
- 상위 5개 밖의 새 기록도 `saveLocalResult().rank`가 6 이상으로 반환되는지 검증한다.
- `getLocalRank(getLastResult())`가 방금 기록의 전체 순위를 재현하는지 검증한다.
- 기존 `LOCAL_SCORES_KEY` 배열과 기존 `LOCAL_BEST_KEY` 단일 레코드에서 전체 이력으로 승격되는지 검증한다.
- malformed JSON과 storage `setItem` 예외가 앱을 중단시키지 않고 실패 상태를 반환하는지 검증한다.

## Acceptance Criteria

- [ ] 전체 로컬 기록이 `localStorage`에 유지되고 새로고침·재실행 후에도 읽힌다.
- [ ] 최고 기록은 점수 내림차순 상위 5개로 계산된다.
- [ ] 점수 동점 시 먼저 달성한 기록이 앞선다.
- [ ] 5위 밖 기록도 정확한 전체 개인 순위를 반환한다.
- [ ] 기존 로컬 저장 데이터와 malformed 데이터가 안전하게 처리된다.

## Validation

- `node --test --test-concurrency=1 test/run-resume.test.js`
- `node --test --test-concurrency=1 test/app-flow.test.js`

## Commit Message

```text
feat(storage): preserve full local record history and personal rank

Plan: 2026-09-23-local-personal-records
Phase: P01-local-personal-records
Task: T01-local-record-history

- store all local results while exposing a top-five view
- calculate ranks outside the visible top five and migrate legacy data
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: 3180379
