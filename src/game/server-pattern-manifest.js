const PATTERN_VERSION = "cat-runner-patterns-v3";
const CANVAS_WIDTH = 1600;
const PLAYER_WIDTH = 90;
const GAP_MIN_WIDTH = 140;
const GAP_MAX_WIDTH = 220;
const GAP_SAFE_MARGIN = 200;
const GAP_CHANCE = Object.freeze({
  home_day: 0,
  outside: 0.15,
  home_night: 0.3,
});
const ZONE_ORDER = Object.freeze({
  home_day: 0,
  outside: 1,
  home_night: 2,
});

const PATTERNS = [
  {
    id: "jump-basic",
    width: 1200,
    minGap: 240,
    safePath: "jump",
    gapAnchor: { x: 742 },
    requiredActions: [],
    entities: [
      { type: "obstacle", x: 420, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "mouse", x: 300, y: 610, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "mouse", x: 500, y: 490, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "obstacle", x: 180, y: 620, width: 90, height: 80, variant: "pot", collectible: false, minZone: "outside" },
    ],
  },
  {
    id: "slide-basic",
    width: 1400,
    minGap: 240,
    safePath: "slide",
    gapAnchor: { x: 858 },
    requiredActions: [],
    entities: [
      { type: "obstacle", x: 420, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "mouse", x: 280, y: 640, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 610, y: 585, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 140, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  },
  {
    id: "mixed-safe",
    width: 1400,
    minGap: 260,
    safePath: "mixed",
    gapAnchor: { x: 940 },
    requiredActions: [],
    entities: [
      { type: "obstacle", x: 390, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 610, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "mouse", x: 250, y: 600, width: 42, height: 42, variant: "toy", collectible: true },
      { type: "grass", x: 520, y: 600, width: 48, height: 72, variant: "cat-grass", collectible: true },
      { type: "obstacle", x: 120, y: 620, width: 90, height: 80, variant: "box", collectible: false, minZone: "outside" },
    ],
  },
  {
    id: "combo-jump-slide-jump",
    width: 1600,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    requiredActions: ["jump", "slide", "jump"],
    gapAnchor: { x: 1100 },
    entities: [
      { type: "obstacle", x: 300, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 430, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 560, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
    ],
  },
  {
    id: "combo-slide-jump-slide",
    width: 1600,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    requiredActions: ["slide", "jump", "slide"],
    gapAnchor: { x: 1100 },
    entities: [
      { type: "obstacle", x: 300, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 430, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 560, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  },
  {
    id: "combo-jump-jump-slide",
    width: 1600,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    requiredActions: ["jump", "jump", "slide"],
    gapAnchor: { x: 1100 },
    entities: [
      { type: "obstacle", x: 300, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 430, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 560, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
    ],
  },
  {
    id: "combo-slide-slide-jump",
    width: 1600,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    requiredActions: ["slide", "slide", "jump"],
    gapAnchor: { x: 1100 },
    entities: [
      { type: "obstacle", x: 300, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 430, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 560, y: 620, width: 90, height: 80, variant: "box", collectible: false },
    ],
  },
  {
    id: "combo-jump-slide-slide",
    width: 1600,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    requiredActions: ["jump", "slide", "slide"],
    gapAnchor: { x: 1100 },
    entities: [
      { type: "obstacle", x: 300, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
      { type: "obstacle", x: 430, y: 560, width: 140, height: 40, variant: "fence", collectible: false },
      { type: "obstacle", x: 560, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
    ],
  },
  {
    id: "combo-slide-jump-jump",
    width: 1600,
    minGap: 300,
    minZone: "outside",
    safePath: "mixed",
    requiredActions: ["slide", "jump", "jump"],
    gapAnchor: { x: 1100 },
    entities: [
      { type: "obstacle", x: 300, y: 560, width: 130, height: 40, variant: "yarn", collectible: false },
      { type: "obstacle", x: 430, y: 620, width: 90, height: 80, variant: "box", collectible: false },
      { type: "obstacle", x: 560, y: 620, width: 90, height: 80, variant: "pot", collectible: false },
    ],
  },
];

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
  const maxGapEnd = pattern.gapAnchor.x + GAP_MAX_WIDTH;
  return (
    pattern.minGap >= PLAYER_WIDTH * 1.5 &&
    ["jump", "slide", "mixed"].includes(pattern.safePath) &&
    pattern.gapAnchor.x >= GAP_SAFE_MARGIN &&
    maxGapEnd <= pattern.width - GAP_SAFE_MARGIN &&
    pattern.entities.every(
      (entity) =>
        entity.x + entity.width <= pattern.gapAnchor.x - GAP_SAFE_MARGIN ||
        entity.x >= maxGapEnd + GAP_SAFE_MARGIN,
    )
  );
}

function createServerManifest(seed, { patternCount = 128, zoneId = "outside" } = {}) {
  const random = createRandom(seed);
  let previousId = null;
  let nextPatternX = CANVAS_WIDTH + 300;
  const entities = [];
  const gaps = [];
  const patterns = [];

  for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
    const candidates = PATTERNS.filter(
      (pattern) =>
        pattern.id !== previousId &&
        isValidPattern(pattern) &&
        isZoneEnabled(pattern.minZone, zoneId),
    );
    const pattern = candidates[Math.floor(random() * candidates.length)];
    const startX = nextPatternX;
    const gapRoll = random();
    const gapWidth =
      GAP_MIN_WIDTH +
      Math.floor(random() * (GAP_MAX_WIDTH - GAP_MIN_WIDTH + 1));
    const gapChance = GAP_CHANCE[zoneId] ?? GAP_CHANCE.home_day;
    const generated = pattern.entities
      .map((entity, entityIndex) => ({
        id: pattern.id + "-" + patternIndex + "-" + entityIndex,
        patternId: pattern.id,
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
      }))
      .filter((entity) => isZoneEnabled(entity.minZone, zoneId));
    const generatedGaps =
      gapRoll < gapChance
        ? [{
            id: `${pattern.id}-gap-${patternIndex}`,
            patternId: pattern.id,
            patternIndex,
            x: startX + pattern.gapAnchor.x,
            width: gapWidth,
            minZone: "outside",
          }]
        : [];

    entities.push(...generated);
    gaps.push(...generatedGaps);
    patterns.push({
      id: pattern.id,
      width: pattern.width,
      minGap: pattern.minGap,
      safePath: pattern.safePath,
      minZone: pattern.minZone,
      requiredActions: [...(pattern.requiredActions || [])],
      patternIndex,
      startX,
      entities: generated,
      gaps: generatedGaps,
    });
    nextPatternX = startX + pattern.width + pattern.minGap;
    previousId = pattern.id;
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

module.exports = { PATTERN_VERSION, PATTERNS, createServerManifest };
