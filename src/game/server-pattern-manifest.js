const PATTERN_VERSION = "cat-runner-patterns-v1";
const CANVAS_WIDTH = 1600;
const PLAYER_WIDTH = 90;
const PATTERNS = [
  {
    id: "jump-basic",
    width: 640,
    minGap: 240,
    entities: [
      { type: "obstacle", x: 420, y: 620, width: 90, height: 80, variant: "box" },
      { type: "mouse", x: 300, y: 610, width: 42, height: 42, variant: "toy" },
      { type: "mouse", x: 500, y: 490, width: 42, height: 42, variant: "toy" },
    ],
  },
  {
    id: "slide-basic",
    width: 680,
    minGap: 240,
    entities: [
      { type: "obstacle", x: 420, y: 560, width: 140, height: 40, variant: "fence" },
      { type: "mouse", x: 280, y: 640, width: 42, height: 42, variant: "toy" },
      { type: "grass", x: 610, y: 585, width: 48, height: 72, variant: "cat-grass" },
    ],
  },
  {
    id: "mixed-safe",
    width: 760,
    minGap: 260,
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

function createServerManifest(seed, { patternCount = 128 } = {}) {
  const random = createRandom(seed);
  let previousId = null;
  let nextPatternX = CANVAS_WIDTH + 300;
  const entities = [];
  const patterns = [];

  for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
    const candidates = PATTERNS.filter((pattern) => pattern.id !== previousId);
    const pattern = candidates[Math.floor(random() * candidates.length)];
    const startX = nextPatternX;
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
    entities.push(...generated);
    patterns.push({ id: pattern.id, patternIndex, startX, entities: generated });
    nextPatternX = startX + pattern.width + pattern.minGap;
    previousId = pattern.id;
  }

  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  return {
    version: PATTERN_VERSION,
    seed: String(seed),
    patterns,
    entities,
    entityById,
    getEntity: (entityId) => entityById.get(entityId) || null,
  };
}

module.exports = { PATTERN_VERSION, createServerManifest };
