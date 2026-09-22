import { GAME_CONFIG } from "./constants.js";

const ZONE_DEFINITIONS = Object.freeze({
  home_day: Object.freeze({
    id: "home_day",
    minScore: 0,
    background: "living-room",
    difficulty: 1,
  }),
  outside: Object.freeze({
    id: "outside",
    minScore: 1000,
    background: "alley-park",
    difficulty: 1.2,
  }),
  home_night: Object.freeze({
    id: "home_night",
    minScore: 2500,
    background: "dark-home",
    difficulty: 1.5,
  }),
});

const PATTERN_VERSION = "cat-runner-patterns-v2";

const PATTERN_LIBRARY = Object.freeze([
  Object.freeze({
    id: "jump-basic",
    width: 1200,
    minGap: 240,
    safePath: "jump",
    gapAnchor: Object.freeze({ x: 742 }),
    entities: Object.freeze([
      Object.freeze({
        type: "obstacle",
        x: 420,
        y: 620,
        width: 90,
        height: 80,
        variant: "box",
        collectible: false,
      }),
      Object.freeze({
        type: "mouse",
        x: 300,
        y: 610,
        width: 42,
        height: 42,
        variant: "toy",
        collectible: true,
      }),
      Object.freeze({
        type: "mouse",
        x: 500,
        y: 490,
        width: 42,
        height: 42,
        variant: "toy",
        collectible: true,
      }),
    ]),
  }),
  Object.freeze({
    id: "slide-basic",
    width: 1400,
    minGap: 240,
    safePath: "slide",
    gapAnchor: Object.freeze({ x: 858 }),
    entities: Object.freeze([
      Object.freeze({
        type: "obstacle",
        x: 420,
        y: 560,
        width: 140,
        height: 40,
        variant: "fence",
        collectible: false,
      }),
      Object.freeze({
        type: "mouse",
        x: 280,
        y: 640,
        width: 42,
        height: 42,
        variant: "toy",
        collectible: true,
      }),
      Object.freeze({
        type: "grass",
        x: 610,
        y: 585,
        width: 48,
        height: 72,
        variant: "cat-grass",
        collectible: true,
      }),
    ]),
  }),
  Object.freeze({
    id: "mixed-safe",
    width: 1400,
    minGap: 260,
    safePath: "mixed",
    gapAnchor: Object.freeze({ x: 940 }),
    entities: Object.freeze([
      Object.freeze({
        type: "obstacle",
        x: 390,
        y: 620,
        width: 90,
        height: 80,
        variant: "pot",
        collectible: false,
      }),
      Object.freeze({
        type: "obstacle",
        x: 610,
        y: 560,
        width: 130,
        height: 40,
        variant: "yarn",
        collectible: false,
      }),
      Object.freeze({
        type: "mouse",
        x: 250,
        y: 600,
        width: 42,
        height: 42,
        variant: "toy",
        collectible: true,
      }),
      Object.freeze({
        type: "grass",
        x: 520,
        y: 600,
        width: 48,
        height: 72,
        variant: "cat-grass",
        collectible: true,
      }),
    ]),
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

function isValidPattern(pattern) {
  const gapAnchor = pattern.gapAnchor;
  const maxGapEnd = (gapAnchor?.x || 0) + GAME_CONFIG.gapMaxWidth;
  const gapSafe =
    gapAnchor &&
    gapAnchor.x >= GAME_CONFIG.gapSafeMargin &&
    maxGapEnd <= pattern.width - GAME_CONFIG.gapSafeMargin &&
    pattern.entities.every(
      (entity) =>
        entity.x + entity.width <= gapAnchor.x - GAME_CONFIG.gapSafeMargin ||
        entity.x >= maxGapEnd + GAME_CONFIG.gapSafeMargin,
    );
  return (
    pattern.minGap >= GAME_CONFIG.playerWidth * 1.5 &&
    ["jump", "slide", "mixed"].includes(pattern.safePath) &&
    gapSafe &&
    pattern.entities.every(
      (entity) =>
        Number.isFinite(entity.x) &&
        Number.isFinite(entity.y) &&
        entity.width > 0 &&
        entity.height > 0,
    )
  );
}

function createPatternStream(seed) {
  const random = createSeededRandom(seed);
  let previousPatternId = null;
  let sequence = 0;

  return {
    next(zoneId = "home_day") {
      const candidates = PATTERN_LIBRARY.filter(
        (pattern) => pattern.id !== previousPatternId && isValidPattern(pattern),
      );
      if (candidates.length === 0) {
        throw new Error("No valid pattern candidate available.");
      }

      const pattern = candidates[Math.floor(random() * candidates.length)];
      const patternIndex = sequence;
      sequence += 1;
      previousPatternId = pattern.id;
      const gapRoll = random();
      const gapWidth =
        GAME_CONFIG.gapMinWidth +
        Math.floor(
          random() * (GAME_CONFIG.gapMaxWidth - GAME_CONFIG.gapMinWidth + 1),
        );
      const gapChance =
        zoneId === "outside"
          ? GAME_CONFIG.gapChanceOutside
          : zoneId === "home_night"
            ? GAME_CONFIG.gapChanceHomeNight
            : 0;
      const gaps =
        gapRoll < gapChance
          ? [
              {
                id: `${pattern.id}-gap-${patternIndex}`,
                x: pattern.gapAnchor.x,
                width: gapWidth,
                minZone: "outside",
              },
            ]
          : [];

      return {
        id: pattern.id,
        width: pattern.width,
        minGap: pattern.minGap,
        safePath: pattern.safePath,
        patternIndex,
        gaps,
        entities: pattern.entities.map((entity, entityIndex) => ({
          ...entity,
          id: pattern.id + "-" + patternIndex + "-" + entityIndex,
          effectRoll:
            entity.type === "grass" ? random() : undefined,
          collected: false,
          hitByPlayer: false,
        })),
      };
    },
  };
}

export {
  PATTERN_LIBRARY,
  PATTERN_VERSION,
  ZONE_DEFINITIONS,
  createPatternStream,
  isValidPattern,
};
