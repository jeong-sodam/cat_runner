# Task: T02 DEX Rate Cooldown Parity

## Status: done

## Goal

alphabet formation에서 DEX 분기를 5%에서 15%로 올리고, DEX가 생성된 뒤 다음 2개 pattern에서는 DEX를 재생성하지 않는다. client `createPatternStream`와 server manifest가 동일한 random 소비 순서와 cooldown 상태 전이를 사용하여 같은 seed에서 동일한 formation과 DEX sequence를 생성하게 한다.

## Decision Summary

- DEX chance는 alphabet kind가 선택된 경우에만 0.15로 적용한다.
- cooldown은 DEX 생성 직후 `2`로 설정하고 이후 각 pattern 생성마다 1씩 감소한다. cooldown이 양수인 pattern에서는 DEX를 금지한다.
- 기존 D/E/X 3문자 sequence, obstacle suppression, zone availability, formation frequency는 유지한다.

## Implementation

### I01. Client formation probability and stream cooldown

- Related Files:
  - `public/js/game/mouse-formations.js` :: `createFormation`; modify
  - `public/js/game/patterns.js` :: `createPatternStream`; modify
  - `public/js/game/constants.js` :: new shared DEX chance/cooldown constants only if the current module boundary supports it; modify only if needed

#### Details

- `createFormation(randomSource, options = {})`에 DEX chance/eligibility 옵션을 추가하되 기존 `forceDex` 테스트 API와 non-alphabet behavior를 보존한다.
- alphabet branch에서 DEX random roll은 항상 같은 위치에서 소비한다. `dexChance`는 `0.15`, `allowDex`는 stream cooldown이 0일 때 true로 전달한다. `allowDex: false`여도 roll 소비를 생략하지 않아 server parity를 깨지 않는다.
- `createPatternStream` closure에 `dexCooldownRemaining = 0`을 추가한다.
- 매 `next(zoneId)` 호출에서 formation 생성 전 cooldown을 읽고, formation이 DEX이면 cooldown을 2로 설정한다. DEX가 아니면 cooldown이 양수일 때 1 감소한다. formation이 없는 pattern도 pattern 1개를 소비한 것으로 간주해 cooldown을 감소시킨다.
- cooldown은 zone 전환과 무관하게 같은 stream의 pattern index 기준으로 적용한다.
- 반환 pattern의 `formation.isDex`, `formation.sequence`, `obstacleSuppressed`와 일반 formation metadata는 기존 형태를 유지한다.

### I02. Server manifest parity

- Related Files:
  - `src/game/server-pattern-manifest.js` :: `createFormation`, `createServerManifest`, DEX constants; modify

#### Details

- client와 동일한 `DEX_CHANCE = 0.15`, `DEX_COOLDOWN_PATTERNS = 2` 의미를 사용한다.
- `createServerManifest`의 pattern loop에 `dexCooldownRemaining`을 추가하고 client와 동일하게 formation 생성 전 eligibility를 계산하고 생성 후 cooldown을 갱신한다.
- alphabet 선택·label 선택·DEX roll·formation roll의 random 호출 순서를 client와 정확히 맞춘다. DEX cooldown 때문에 roll을 건너뛰어 seed sequence가 달라지지 않도록 한다.
- `createServerManifest(seed, { zoneId })`가 client `createPatternStream(seed).next(zoneId)`와 동일한 pattern IDs, formation kind/label/isDex/sequence, obstacle suppression, entity formation fields를 내도록 한다.
- PATTERN_VERSION은 parity change에 맞춰 올릴 필요가 있는지 확인한다. 올리는 경우 client/server 모두 동일한 새 버전을 사용하고 validation test를 갱신한다.

## Acceptance Criteria

- [ ] seeded alphabet formations use an exact 15% DEX branch when cooldown is available.
- [ ] after every DEX, the next two generated patterns contain no DEX; the third eligible pattern may contain DEX.
- [ ] client and server produce identical DEX cooldown behavior and formation metadata for the same seed and zone.
- [ ] existing DEX obstacle suppression and D/E/X collection flow remain intact.

## Validation

- `node test/game-systems.test.js`
- `node test/score-validation.test.js`
- `node test/integration.test.js`

## Commit Message

```text
feat(patterns): raise dex rate with deterministic cooldown

Plan: 2026-09-26-mouse-overlap-dex-rate
Phase: P01-mouse-overlap-dex-rate
Task: T02-dex-rate-cooldown-parity

- raise alphabet DEX chance to fifteen percent
- block DEX for the next two patterns after each event
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: recorded in git history

## Validation Results

- `node test/game-systems.test.js`: pass, 29/29.
- `node test/score-validation.test.js`: pass, 11/11.
- `node test/integration.test.js`: manifest regression assertion passes, then exits on the existing Windows `better-sqlite3` cleanup-hook assertion.
- Additional seeded parity check: client/server DEX indexes matched for `home_day`, `outside`, and `home_night`; every sampled DEX had at least two intervening pattern indexes before another DEX.
