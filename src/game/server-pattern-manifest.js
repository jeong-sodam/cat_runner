const PATTERN_VERSION = "cat-runner-patterns-v4";
const CANVAS_WIDTH = 1600;
const PLAYER_WIDTH = 90;
const GAP_MIN_WIDTH = 140;
const GAP_MAX_WIDTH = 220;
const GAP_SAFE_MARGIN = 200;
const COMPOSITE_SAFE_MARGIN = 120;
const GAP_CHANCE = Object.freeze({ home_day: 0, outside: 0.15, home_night: 0.3 });
const ZONE_ORDER = Object.freeze({ home_day: 0, outside: 1, home_night: 2 });
const GROUND_ACTIONS = Object.freeze(["jump"]);
const LOW_ACTIONS = Object.freeze(["jump", "slide"]);

function pattern(definition) {
  return Object.freeze({
    ...definition,
    gapAnchor: Object.freeze({ ...definition.gapAnchor }),
    requiredActions: Object.freeze([...(definition.requiredActions || [])]),
    actionCandidates: Object.freeze(
      (definition.actionCandidates || []).map((actions) => Object.freeze([...actions])),
    ),
    entities: Object.freeze(definition.entities.map((entity) => Object.freeze({ ...entity }))),
  });
}

const PATTERNS = Object.freeze([
  pattern({
    id: "jump-basic", width: 1200, minGap: 240, safePath: "jump", gapAnchor: { x: 742 },
    entities: [
      { type: "obstacle", x: 420, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "mouse", x: 300, y: 610, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "mouse", x: 500, y: 490, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "obstacle", x: 180, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" },
    ],
  }),
  pattern({
    id: "slide-basic", width: 1400, minGap: 240, safePath: "slide", gapAnchor: { x: 858 },
    entities: [
      { type: "obstacle", x: 420, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "mouse", x: 280, y: 640, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 610, y: 585, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 140, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  pattern({
    id: "mixed-safe", width: 1400, minGap: 260, safePath: "mixed", gapAnchor: { x: 940 },
    entities: [
      { type: "obstacle", x: 390, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 610, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "mouse", x: 250, y: 600, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 520, y: 600, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 120, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  }),
  pattern({
    id: "combo-jump-slide-jump", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  pattern({
    id: "combo-slide-jump-slide", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  }),
  pattern({
    id: "combo-jump-jump-slide", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, GROUND_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 680, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 940, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  }),
  pattern({
    id: "combo-slide-slide-jump", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 520, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 780, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 990, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
    ],
  }),
  pattern({
    id: "combo-jump-slide-slide", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
    actionCandidates: [GROUND_ACTIONS, LOW_ACTIONS, LOW_ACTIONS, GROUND_ACTIONS],
    entities: [
      { type: "obstacle", x: 260, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 470, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 730, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 980, y: 620, width: 90, height: 80, variant: "box", collectible: false },
    ],
  }),
  pattern({
    id: "combo-slide-jump-jump", width: 2200, minGap: 300, minZone: "outside", safePath: "mixed",
    advancedSafeMargin: COMPOSITE_SAFE_MARGIN, gapAnchor: { x: 1500 },
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

function createRandom(seed) {
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

function isValidPattern(pattern) {
  const safeMargin = pattern.advancedSafeMargin ?? GAP_SAFE_MARGIN;
  const maxGapEnd = pattern.gapAnchor.x + GAP_MAX_WIDTH;
  const obstacles = pattern.entities.filter((entity) => entity.type === "obstacle");
  return pattern.minGap >= PLAYER_WIDTH * 1.5 &&
    ["jump", "slide", "mixed"].includes(pattern.safePath) &&
    pattern.gapAnchor.x >= safeMargin &&
    maxGapEnd <= pattern.width - safeMargin &&
    pattern.entities.every((entity) =>
      entity.x + entity.width <= pattern.gapAnchor.x - safeMargin ||
      entity.x >= maxGapEnd + safeMargin,
    ) &&
    (pattern.advancedSafeMargin == null || obstacles.every((entity, index) => {
      const next = obstacles[index + 1];
      return !next || next.x - (entity.x + entity.width) >= safeMargin;
    })) &&
    pattern.entities.every((entity) => entity.x >= 0 && entity.width > 0 && entity.height > 0);
}

function createServerManifest(seed, { patternCount = 128, zoneId = "outside" } = {}) {
  const random = createRandom(seed);
  let previousId = null;
  let nextPatternX = CANVAS_WIDTH + 300;
  const entities = [];
  const gaps = [];
  const patterns = [];

  for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
    const candidates = PATTERNS.filter((candidate) =>
      candidate.id !== previousId &&
      isValidPattern(candidate) &&
      isZoneEnabled(candidate.minZone, zoneId),
    );
    const selected = candidates[Math.floor(random() * candidates.length)];
    const startX = nextPatternX;
    const gapRoll = random();
    const gapWidth = GAP_MIN_WIDTH + Math.floor(random() * (GAP_MAX_WIDTH - GAP_MIN_WIDTH + 1));
    const requiredActions = (selected.actionCandidates || []).map((actions) =>
      actions[Math.floor(random() * actions.length)],
    );
    const gapChance = GAP_CHANCE[zoneId] ?? GAP_CHANCE.home_day;
    const generated = selected.entities.map((entity, entityIndex) => ({
      id: `${selected.id}-${patternIndex}-${entityIndex}`,
      patternId: selected.id,
      patternIndex,
      type: entity.type,
      x: startX + entity.x,
      y: entity.y,
      width: entity.width,
      height: entity.height,
      variant: entity.variant,
      collectible: entity.collectible,
      minZone: entity.minZone,
      effectRoll: entity.type === "grass" ? random() : undefined,
    })).filter((entity) => isZoneEnabled(entity.minZone, zoneId));
    const generatedGaps = gapRoll < gapChance ? [{
      id: `${selected.id}-gap-${patternIndex}`,
      patternId: selected.id,
      patternIndex,
      x: startX + selected.gapAnchor.x,
      width: gapWidth,
      minZone: "outside",
    }] : [];

    entities.push(...generated);
    gaps.push(...generatedGaps);
    patterns.push({
      id: selected.id,
      width: selected.width,
      minGap: selected.minGap,
      safePath: selected.safePath,
      minZone: selected.minZone,
      advancedSafeMargin: selected.advancedSafeMargin,
      actionCandidates: (selected.actionCandidates || []).map((actions) => [...actions]),
      requiredActions,
      patternIndex,
      startX,
      entities: generated,
      gaps: generatedGaps,
    });
    nextPatternX = startX + selected.width + selected.minGap;
    previousId = selected.id;
  }

  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const gapById = new Map(gaps.map((gap) => [gap.id, gap]));
  return {
    version: PATTERN_VERSION,
    seed: String(seed),
    zoneId,
    patterns,
    entities,
    gaps,
    entityById,
    gapById,
    getEntity: (entityId) => entityById.get(entityId) || null,
    getGap: (gapId) => gapById.get(gapId) || null,
  };
}

module.exports = {
  COMPOSITE_SAFE_MARGIN,
  PATTERN_VERSION,
  PATTERNS,
  createServerManifest,
};
