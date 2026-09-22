const PATTERN_VERSION = "cat-runner-patterns-v2";
const CANVAS_WIDTH = 1600;
const PLAYER_WIDTH = 90;
const GAP_MIN_WIDTH = 140;
const GAP_MAX_WIDTH = 220;
const GAP_SAFE_MARGIN = 200;
const PATTERNS = [
  {
    id: "jump-basic",
    width: 1200,
    minGap: 240,
    safePath: "jump",
    gapAnchor: { x: 742 },
    entities: [
      { type: "obstacle", x: 420, y: 620, width: 90, height: 80, variant: "box" },
      { type: "mouse", x: 300, y: 610, width: 42, height: 42, variant: "toy" },
      { type: "mouse", x: 500, y: 490, width: 42, height: 42, variant: "toy" },
    ],
  },
  {
    id: "slide-basic",
    width: 1400,
    minGap: 240,
    safePath: "slide",
    gapAnchor: { x: 858 },
    entities: [
      { type: "obstacle", x: 420, y: 560, width: 140, height: 40, variant: "fence" },
      { type: "mouse", x: 280, y: 640, width: 42, height: 42, variant: "toy" },
      { type: "grass", x: 610, y: 585, width: 48, height: 72, variant: "cat-grass" },
    ],
  },
  {
    id: "mixed-safe",
    width: 1400,
    minGap: 260,
    safePath: "mixed",
    gapAnchor: { x: 940 },
    entities: [
      { type: "obstacle", x: 390, y: 620, width: 90, height: 80, variant: "pot" },
      { type: "obstacle", x: 610, y: 560, width: 130, height: 40, variant: "yarn" },
      { type: "mouse", x: 250, y: 600, width: 42, height: 42, variant: "toy" },
      { type: "grass", x: 520, y: 600, width: 48, height: 72, variant: "cat-grass" },
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

function createServerManifest(seed, { patternCount = 128 } = {}) {
  const random = createRandom(seed);
  let previousId = null;
  let nextPatternX = CANVAS_WIDTH + 300;
  const entities = [];
  const gaps = [];
  const patterns = [];

  for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
    const candidates = PATTERNS.filter(
      (pattern) => pattern.id !== previousId && isValidPattern(pattern),
    );
    const pattern = candidates[Math.floor(random() * candidates.length)];
    const startX = nextPatternX;
    const gapRoll = random();
    const gapWidth =
      GAP_MIN_WIDTH +
      Math.floor(random() * (GAP_MAX_WIDTH - GAP_MIN_WIDTH + 1));
    const generated = pattern.entities.map((entity, entityIndex) => ({
      id: pattern.id + "-" + patternIndex + "-" + entityIndex,
      patternId: pattern.id,
      patternIndex,
      type: entity.type,
      x: startX + entity.x,
      y: entity.y,
      width: entity.width,
      height: entity.height,
      variant: entity.variant,
      effectRoll: entity.type === "grass" ? random() : undefined,
    }));
    const generatedGap = {
      id: `${pattern.id}-gap-${patternIndex}`,
      patternId: pattern.id,
      patternIndex,
      x: startX + pattern.gapAnchor.x,
      width: gapWidth,
      minZone: "outside",
    };
    entities.push(...generated);
    gaps.push(generatedGap);
    patterns.push({
      id: pattern.id,
      patternIndex,
      startX,
      entities: generated,
      gaps: [generatedGap],
    });
    nextPatternX = startX + pattern.width + pattern.minGap;
    previousId = pattern.id;
  }

  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const gapById = new Map(gaps.map((gap) => [gap.id, gap]));
  return {
    version: PATTERN_VERSION,
    seed: String(seed),
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
