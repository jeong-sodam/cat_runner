import { GAME_CONFIG } from "./constants.js";
import { ZONE_DEFINITIONS } from "./patterns.js";

const PATTERN_SPACING_FACTOR = 0.75;

function resolvePatternSpacing(pattern) {
  const safeMinimumGap = GAME_CONFIG.playerWidth * 1.5;
  return Math.max(pattern.minGap * PATTERN_SPACING_FACTOR, safeMinimumGap);
}

function spawnNextPattern(state, patternStream) {
  let pattern;
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const candidate = patternStream.next(state.zoneId);
    if (
      candidate.minGap >= GAME_CONFIG.playerWidth * 1.5 &&
      candidate.entities.every((entity) => entity.x >= 0)
    ) {
      pattern = candidate;
      break;
    }
  }
  if (!pattern) {
    throw new Error("Unable to spawn a safe pattern.");
  }

  const startX = Math.max(
    state.nextPatternX,
    state.worldOffset + GAME_CONFIG.canvasWidth + 200,
  );
  const entities = pattern.entities.map((entity) => ({
    ...entity,
    x: startX + entity.x,
    patternId: pattern.id,
    patternIndex: pattern.patternIndex,
  }));
  const gaps = (pattern.gaps || []).map((gap) => ({
    ...gap,
    x: startX + gap.x,
    patternId: pattern.id,
    patternIndex: pattern.patternIndex,
  }));
  state.worldEntities.push(...entities);
  state.worldGaps.push(...gaps);
  state.nextPatternX = startX + pattern.width + resolvePatternSpacing(pattern);
  state.lastPatternId = pattern.id;
  state.patternIndex = pattern.patternIndex + 1;

  return { ...pattern, startX, entities, gaps };
}

function updateWorldEntities(state, patternStream) {
  while (
    state.nextPatternX <
    state.worldOffset + GAME_CONFIG.canvasWidth * 2
  ) {
    spawnNextPattern(state, patternStream);
  }

  state.worldEntities = state.worldEntities.filter(
    (entity) => entity.x - state.worldOffset > state.player.x - 200,
  );
  state.worldGaps = state.worldGaps.filter(
    (gap) => gap.x + gap.width - state.worldOffset > state.player.x - 200,
  );
  return state.worldEntities;
}

function selectZoneForScore(score) {
  if (score >= ZONE_DEFINITIONS.home_night.minScore) {
    return "home_night";
  }
  if (score >= ZONE_DEFINITIONS.outside.minScore) {
    return "outside";
  }
  return "home_day";
}

export {
  PATTERN_SPACING_FACTOR,
  resolvePatternSpacing,
  selectZoneForScore,
  spawnNextPattern,
  updateWorldEntities,
};
