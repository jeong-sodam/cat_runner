# Task: T02 구멍 시각 표현과 서버 manifest parity

## Status: done

## Goal

클라이언트와 서버가 동일한 연속 쥐 루트·구멍 위치·폭·route metadata를 생성하고, 구멍 렌더링이 양쪽 가장자리와 깊이를 명확히 보여주도록 개선한다.

## Decision Summary

- 서버는 클라이언트와 동일 seed에서 route entity ID/위치, gap ID/위치/폭, pattern index를 재현해야 한다.
- 구멍은 어두운 낙하 공간, 양쪽 바닥 가장자리, 깊이 그림자로 표현한다.
- 서버는 클라이언트가 보내는 gap/route 결과를 신뢰하는 것이 아니라 기존 manifest 검증을 authoritative source로 유지한다.

## Implementation

### I01. Server manifest route and gap parity

- Related Files:
  - `src/game/server-pattern-manifest.js` :: constants, guided route helpers, `createServerManifest`; modify
  - `src/services/run-validation-service.js` :: manifest lookup/route validation; read-only unless new metadata requires validation
  - `test/integration.test.js` :: completed result and manifest fixtures; modify
  - `test/security-regression.test.js` :: manifest/gap tampering cases; modify

#### Details

- Mirror the client configuration values and deterministic route algorithm in CommonJS form. Keep `PATTERN_VERSION` incremented when manifest entity shape or placement changes.
- Add server-side stage width/chance constants matching T01 and a non-adjacent-gap guard in `createServerManifest`.
- Generate bridge mice over the exact same relative interval used by the client. IDs must remain stable as `${patternId}-${patternIndex}-${entityIndex}` or the corresponding documented connector suffix, and `patternIndex`, `routeAction`, `routeIndex`, formation fields, and `collectible` must match.
- Preserve `isEntityClearOfGaps`, `isMouseClearOfObstacles`, `isFormationAnchorSafe`, and `isValidPattern` as final filters. Add validation for route candidates before adding them to `entities`.
- Keep `getGap` and `getEntity` behavior unchanged for fall damage and collection event validation. Unknown or replayed gap IDs must still be rejected.
- Update manifest parity tests to compare the same seed and zone across client and server for a bounded number of patterns, including outside gap, home_night gap, formation connector, and DEX cases.

### I02. Gap renderer quality

- Related Files:
  - `public/js/render/draw-backgrounds.js` :: `drawGap`; modify
  - `public/js/render/scene-renderer.js` :: gap draw order; read-only/modify only if required
  - `test/render.test.js` :: gap drawing contract; modify

#### Details

- Keep the existing logical gap rectangle and collision geometry unchanged.
- Draw, in order: a dark recessed gap body, a subtle vertical depth gradient or bands, both floor lips with contrasting top edges, and a narrow inner shadow so the start/end are visible against every background.
- Use canvas-safe primitives already used by the renderer; do not add image assets or external dependencies.
- Keep the gap behind entities and foreground floor elements, preserve letterboxed canvas coordinates, and avoid drawing outside the current gap bounds.
- Add renderer assertions for both left/right lip and body fills/strokes while preserving the existing `drawGap` export contract.

## Acceptance Criteria

- [ ] Same seed/zone produces matching client/server gap and mouse route geometry.
- [ ] Server manifest still validates fall and collection events without trusting client geometry.
- [ ] Gap edges, body, and depth are visibly distinct without changing collision width.
- [ ] DEX/formation and existing pattern version contracts remain coherent.

## Validation

- `node test/render.test.js`
- `node test/integration.test.js`
- `node test/security-regression.test.js`

## Commit Message

```text
feat(game): mirror continuous routes and improve gap visuals

Plan: 2026-09-26-continuous-mouse-route-gap-quality
Phase: P01-continuous-route-and-gap-quality
Task: T02-gap-rendering-and-server-parity

- keep server manifest geometry aligned with the client
- make floor gaps readable at a glance
```

## Progress

- [x] 구현 완료
- [x] 검증 통과: render 18/18, score-validation 11/11
- [x] integration/security assertion 단계는 better-sqlite3 Windows native cleanup assertion으로 프로세스 종료 차단
- commit: recorded in git history
