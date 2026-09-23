import { GAME_CONFIG } from "./constants.js";
import {
  FORMATION_CELL_SIZE,
  FORMATION_CELL_STEP,
  FORMATION_HEIGHT,
  FORMATION_WIDTH,
  createFormation,
} from "./mouse-formations.js";

const ZONE_DEFINITIONS = Object.freeze({
  home_day: Object.freeze({ id: "home_day", minScore: 0, background: "living-room", difficulty: 1 }),
  outside: Object.freeze({ id: "outside", minScore: 700, background: "alley-park", difficulty: 1.2 }),
  home_night: Object.freeze({ id: "home_night", minScore: 1800, background: "dark-home", difficulty: 1.5 }),
});

const PATTERN_VERSION = "cat-runner-patterns-v5";
const COMPOSITE_SAFE_MARGIN = 120;

const ZONE_ORDER = Object.freeze({ home_day: 0, outside: 1, home_night: 2 });

function freezeEntity(entity) {
  return Object.freeze({ ...entity });
}

function freezePattern(pattern) {
  return Object.freeze({
    ...pattern,
    gapAnchor: Object.freeze({ ...pattern.gapAnchor }),
    formationAnchor: Object.freeze({
      x: pattern.formationAnchor?.x ?? pattern.gapAnchor.x,
      y: pattern.formationAnchor?.y ?? 470,
    }),
    requiredActions: Object.freeze([...(pattern.requiredActions || [])]),
    actionCandidates: Object.freeze(
      (pattern.actionCandidates || []).map((actions) => Object.freeze([...actions])),
    ),
    entities: Object.freeze(pattern.entities.map(freezeEntity)),
  });
}

const GROUND_ACTIONS = Object.freeze(["jump"]);
const LOW_ACTIONS = Object.freeze(["jump", "slide"]);

const PATTERN_LIBRARY = Object.freeze([
  freezePattern({
    id: "jump-basic",
    width: 1200,
    minGap: 240,
    safePath: "jump",
    gapAnchor: { x: 742 },
    entities: [
      { type: "obstacle", x: 420, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "mouse", x: 300, y: 610, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "mouse", x: 500, y: 490, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "obstacle", x: 180, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" },
    ],
  }),
  freezePattern({
    id: "slide-basic",
    width: 1400,
    minGap: 240,
    safePath: "slide",
    gapAnchor: { x: 858 },
    entities: [
      { type: "obstacle", x: 420, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "mouse", x: 280, y: 640, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 610, y: 585, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 140, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  freezePattern({
    id: "mixed-safe",
    width: 1400,
    minGap: 260,
    safePath: "mixed",
    gapAnchor: { x: 940 },
    entities: [
      { type: "obstacle", x: 390, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 610, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "mouse", x: 250, y: 600, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 520, y: 600, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 120, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  freezePattern({
    id: "combo-jump-slide-jump",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-slide-jump-slide",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-jump-jump-slide",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 680, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-slide-slide-jump",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 780, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 990, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-jump-slide-slide",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 620, width: 90, height: 80, variant: "box", collectible: false },
    ],
  }),
  freezePattern({
    id: "combo-slide-jump-jump",
    width: 2200,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN,
    gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 510, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 720, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 930, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
]);

function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let value = hashSeed(seed);
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function zoneRank(zoneId) {
  return ZONE_ORDER[zoneId] ?? ZONE_ORDER.home_day;
}

function isZoneEnabled(minZone, zoneId) {
  return zoneRank(zoneId) >= zoneRank(minZone || "home_day");
}

function isActionSequenceValid(pattern) {
  const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
  const actions = pattern.requiredActions || [];
  const candidates = pattern.actionCandidates || [];
  if (!actions.length) {
    return true;
  }
  if (actions.length !== obstacles.length || candidates.length !== obstacles.length) {
    return false;
  }
  const safeMargin = pattern.advancedSafeMargin ?? GAME_CONFIG.gapSafeMargin;
  return actions.every((action, index) => candidates[index].includes(action)) &&
    obstacles.every((entity, index) => {
      const next = obstacles[index + 1];
      return !next || next.x - (entity.x + entity.width) >= safeMargin;
    });
}

function isValidPattern(pattern) {
  const gapAnchor = pattern.gapAnchor;
  const safeMargin = pattern.advancedSafeMargin ?? GAME_CONFIG.gapSafeMargin;
  const maxGapEnd = (gapAnchor?.x || 0) + GAME_CONFIG.gapMaxWidth;
  const gapSafe = gapAnchor &&
    gapAnchor.x >= safeMargin &&
    maxGapEnd <= pattern.width - safeMargin &&
    pattern.entities.every((entity) =>
      entity.x + entity.width <= gapAnchor.x - safeMargin ||
      entity.x >= maxGapEnd + safeMargin,
    );
  const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
  const obstacleSpacing = pattern.advancedSafeMargin == null || obstacles.every((entity, index) => {
    const next = obstacles[index + 1];
    return !next || next.x - (entity.x + entity.width) >= safeMargin;
  });
  return pattern.minGap >= GAME_CONFIG.playerWidth * 1.5 &&
    ["jump", "slide", "mixed"].includes(pattern.safePath) &&
    gapSafe &&
    obstacleSpacing &&
    pattern.entities.every((entity) =>
      Number.isFinite(entity.x) && Number.isFinite(entity.y) &&
      entity.width > 0 && entity.height > 0,
    ) &&
    isActionSequenceValid(pattern);
}

function isFormationAnchorSafe(pattern) {
  const anchor = pattern.formationAnchor;
  if (!anchor || anchor.x < GAME_CONFIG.gapSafeMargin ||
      anchor.x + FORMATION_WIDTH > pattern.width - GAME_CONFIG.gapSafeMargin) {
    return false;
  }
  return pattern.entities.every((entity) =>
    entity.x + entity.width <= anchor.x ||
    entity.x >= anchor.x + FORMATION_WIDTH,
  );
}

function isEntityClearOfGaps(entity, gaps) {
  return gaps.every((gap) =>
    entity.x + entity.width <= gap.x - GAME_CONFIG.gapSafeMargin ||
    entity.x >= gap.x + gap.width + GAME_CONFIG.gapSafeMargin,
  );
}

function addDenseMice(entities, gaps = []) {
  return entities.flatMap((entity) => {
    if (entity.type !== "mouse") {
      return [entity];
    }
    const forward = { ...entity, x: entity.x + FORMATION_CELL_STEP * 2 };
    const backward = { ...entity, x: entity.x - FORMATION_CELL_STEP * 2 };
    const duplicate = isEntityClearOfGaps(forward, gaps)
      ? forward
      : isEntityClearOfGaps(backward, gaps) ? backward : null;
    return [
      entity,
      ...(duplicate ? [duplicate] : []),
    ];
  });
}

function createFormationEntities(formation, pattern) {
  const anchor = pattern.formationAnchor;
  return formation.cells.map((cell) => ({
    type: "mouse",
    x: anchor.x + cell.column * FORMATION_CELL_STEP,
    y: anchor.y + cell.row * FORMATION_CELL_STEP,
    width: FORMATION_CELL_SIZE,
    height: FORMATION_CELL_SIZE,
    variant: "toy",
    collectible: true,
    formationId: formation.label,
    formationKind: formation.kind,
    formationCell: { ...cell },
  }));
}

function createPatternStream(seed) {
  const random = createSeededRandom(seed);
  let previousPatternId = null;
  let sequence = 0;

  return {
    next(zoneId = "home_day") {
      const candidates = PATTERN_LIBRARY.filter((pattern) =>
        pattern.id !== previousPatternId &&
        isValidPattern(pattern) &&
        isZoneEnabled(pattern.minZone, zoneId),
      );
      if (!candidates.length) {
        throw new Error("No valid pattern candidate available.");
      }

      const pattern = candidates[Math.floor(random() * candidates.length)];
      const patternIndex = sequence;
      sequence += 1;
      previousPatternId = pattern.id;
      const gapRoll = random();
      const gapWidth = GAME_CONFIG.gapMinWidth +
        Math.floor(random() * (GAME_CONFIG.gapMaxWidth - GAME_CONFIG.gapMinWidth + 1));
      const requiredActions = (pattern.actionCandidates || []).map((actions) =>
        actions[Math.floor(random() * actions.length)],
      );
      const gapChance = zoneId === "outside"
        ? GAME_CONFIG.gapChanceOutside
        : zoneId === "home_night" ? GAME_CONFIG.gapChanceHomeNight : 0;
      const gaps = gapRoll < gapChance ? [{
        id: `${pattern.id}-gap-${patternIndex}`,
        x: pattern.gapAnchor.x,
        width: gapWidth,
        minZone: "outside",
      }] : [];
      const formationRoll = random();
      const canUseFormation = gaps.length === 0 && isFormationAnchorSafe(pattern);
      const formation = formationRoll < 0.2 && canUseFormation
        ? {
            ...createFormation(random),
            anchor: { ...pattern.formationAnchor },
          }
        : null;
      const sourceEntities = formation
        ? pattern.entities
            .filter((entity) => entity.type !== "mouse")
            .concat(createFormationEntities(formation, pattern))
        : addDenseMice(pattern.entities, gaps);
      const entities = sourceEntities.map((entity, entityIndex) => ({
        ...entity,
        id: `${pattern.id}-${patternIndex}-${entityIndex}`,
        effectRoll: entity.type === "grass" ? random() : undefined,
        collected: false,
        hitByPlayer: false,
      })).filter((entity) => isZoneEnabled(entity.minZone, zoneId));

      return {
        id: pattern.id,
        width: pattern.width,
        minGap: pattern.minGap,
        safePath: pattern.safePath,
        minZone: pattern.minZone,
        advancedSafeMargin: pattern.advancedSafeMargin,
        actionCandidates: (pattern.actionCandidates || []).map((actions) => [...actions]),
        requiredActions,
        formation,
        patternIndex,
        gaps,
        entities,
      };
    },
  };
}

export {
  COMPOSITE_SAFE_MARGIN,
  addDenseMice,
  PATTERN_LIBRARY,
  PATTERN_VERSION,
  ZONE_DEFINITIONS,
  createPatternStream,
  isFormationAnchorSafe,
  isActionSequenceValid,
  isValidPattern,
};
