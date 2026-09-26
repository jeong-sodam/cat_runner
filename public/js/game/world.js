import { GAME_CONFIG } from "./constants.js";
import {
  ALPHABET_MASKS,
  FORMATION_CELL_SIZE,
  FORMATION_CELL_STEP,
  FORMATION_WIDTH,
  maskRowsToCells,
} from "./mouse-formations.js";
import { ZONE_DEFINITIONS } from "./patterns.js";

const PATTERN_SPACING_FACTOR = 0.6375;
const FORMATION_SEQUENCE_GAP = 48;

function createDexEntities(pattern) {
  if (!pattern.formation?.isDex) {
    return pattern.entities;
  }

  const formationEntities = pattern.entities.filter((entity) =>
    entity.formationId !== pattern.formation.label,
  );
  const sequence = pattern.formation.sequence || ["D", "E", "X"];
  const sequenceCells = sequence.flatMap((letter, sequenceIndex) => {
    const cells = maskRowsToCells(ALPHABET_MASKS[letter]);
    const segmentX = pattern.formation.anchor.x +
      sequenceIndex * (FORMATION_WIDTH + FORMATION_SEQUENCE_GAP);
    return cells.map((cell) => ({
      type: "mouse",
      x: segmentX + cell.column * FORMATION_CELL_STEP,
      y: pattern.formation.anchor.y + cell.row * FORMATION_CELL_STEP,
      width: FORMATION_CELL_SIZE,
      height: FORMATION_CELL_SIZE,
      variant: "toy",
      collectible: true,
      formationId: pattern.formation.label,
      formationKind: pattern.formation.kind,
      formationLetter: letter,
      formationSequenceIndex: sequenceIndex,
      formationCell: { ...cell },
    }));
  });
  return formationEntities.concat(sequenceCells);
}

function isFormationEventComplete(state) {
  return state.formationEvent &&
    state.worldOffset >= state.formationEvent.endsAtX;
}

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
  const relativeEntities = createDexEntities(pattern);
  const entities = relativeEntities.map((entity, entityIndex) => ({
    ...entity,
    x: startX + entity.x,
    id: entity.id || `${pattern.id}-${pattern.patternIndex}-${entityIndex}`,
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

  if (pattern.formation?.isDex) {
    const dexEntities = entities.filter((entity) =>
      entity.formationId === pattern.formation.label,
    );
    state.formationEvent = {
      type: "dex",
      entityIds: dexEntities.map((entity) => entity.id),
      endsAtX: Math.max(...dexEntities.map((entity) => entity.x + entity.width)),
    };
  }

  return { ...pattern, startX, entities, gaps };
}

function updateWorldEntities(state, patternStream) {
  if (isFormationEventComplete(state)) {
    state.formationEvent = null;
  }

  while (
    !state.formationEvent &&
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
  FORMATION_SEQUENCE_GAP,
  PATTERN_SPACING_FACTOR,
  resolvePatternSpacing,
  selectZoneForScore,
  spawnNextPattern,
  updateWorldEntities,
};
