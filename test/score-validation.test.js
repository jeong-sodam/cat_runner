const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createServerManifest,
  PATTERN_SPACING_FACTOR,
  PATTERN_VERSION,
} = require("../src/game/server-pattern-manifest");
const { calculateVerifiedResult } = require("../src/services/run-validation-service");

const EFFECTS = ["magnet", "invincible", "double_score", "slow_miss"];
const HEALTH_BY_CAT = Object.freeze({
  black: 2,
  white: 3,
  calico: 5,
  cheese: 3,
  mackerel: 2,
  chaos: 1,
});

function effectFor(entity) {
  return EFFECTS[Math.floor(Math.min(0.999999, Math.max(0, entity.effectRoll)) * 4)];
}

function makeRun(seed = "score-seed", catId = "black") {
  return { id: "run-score", userId: 1, seed, catId, startedAt: 1000 };
}

function makeGameoverEvents(run, options = {}) {
  const manifest = createServerManifest(run.seed);
  const grass = options.grass || null;
  const mouse = options.mouse || manifest.entities.find((entity) => entity.type === "mouse");
  const obstacles = manifest.entities
    .filter((entity) => entity.type === "obstacle")
    .slice(0, HEALTH_BY_CAT[run.catId] || 1);
  const events = [{
    seq: 0,
    type: "run_started",
    occurredAtMs: 0,
    payload: { seed: run.seed, catId: run.catId, patternVersion: PATTERN_VERSION },
  }];
  let seq = 1;
  if (grass) {
    events.push({
      seq: seq++,
      type: "grass_collected",
      occurredAtMs: 100,
      payload: { entityId: grass.id, effectType: effectFor(grass) },
    });
  }
  if (mouse) {
    events.push({
      seq: seq++,
      type: "mouse_collected",
      occurredAtMs: 200,
      payload: { entityId: mouse.id },
    });
  }
  events.push({
    seq: seq++,
    type: "distance_checkpoint",
    occurredAtMs: 300,
    payload: { distanceM: options.distanceM ?? 12 },
  });
  for (const obstacle of obstacles) {
    events.push({
      seq: seq++,
      type: "obstacle_collision",
      occurredAtMs: 400,
      payload: { entityId: obstacle.id, damage: 999, prevented: false },
    });
  }
  events.push({
    seq,
    type: "run_gameover",
    occurredAtMs: 700,
    payload: options.rhythm || {},
  });
  return events;
}

function findSeedForEffect(effectType) {
  for (let index = 0; index < 1000; index += 1) {
    const seed = "effect-" + effectType + "-" + index;
    const grass = createServerManifest(seed).entities.find(
      (entity) => entity.type === "grass" && effectFor(entity) === effectType,
    );
    if (grass) {
      return { seed, grass };
    }
  }
  throw new Error("No seed found for " + effectType);
}

test("valid deterministic stream derives score and ignores fake damage/score fields", () => {
  const run = makeRun();
  const grass = createServerManifest(run.seed).entities.find(
    (entity) => entity.type === "grass" && effectFor(entity) !== "invincible",
  );
  const result = calculateVerifiedResult(run, makeGameoverEvents(run, { grass }), {
    clientFinishedAt: 5000,
  });
  const mousePoints = effectFor(grass) === "double_score" ? 20 : 10;
  assert.equal(result.score, mousePoints + 12);
  assert.equal(result.mouseCount, 1);
  assert.equal(result.health, 0);
});

test("rhythm accuracy uses bounded multipliers and exact bonus points", () => {
  const lowAccuracyRun = makeRun("rhythm-low");
  const lowAccuracy = calculateVerifiedResult(
    lowAccuracyRun,
    makeGameoverEvents(lowAccuracyRun, {
      rhythm: {
        rhythmAccuracy: 0,
        rhythmHitCount: 0,
        rhythmMissCount: 1,
        rhythmBonusHits: 0,
        rhythmBonusPoints: 0,
      },
    }),
    { clientFinishedAt: 5000 },
  );
  assert.equal(lowAccuracy.rhythmMultiplier, 0.5);
  assert.equal(lowAccuracy.score, 11);

  const highAccuracyRun = makeRun("rhythm-high");
  const highAccuracy = calculateVerifiedResult(
    highAccuracyRun,
    makeGameoverEvents(highAccuracyRun, {
      rhythm: {
        rhythmAccuracy: 1,
        rhythmHitCount: 1,
        rhythmMissCount: 0,
        rhythmBonusHits: 1,
        rhythmBonusPoints: 5,
      },
    }),
    { clientFinishedAt: 5000 },
  );
  assert.equal(highAccuracy.rhythmMultiplier, 1.5);
  assert.equal(highAccuracy.rhythmBonusPoints, 5);
  assert.equal(highAccuracy.score, 40);

  const noAttemptRun = makeRun("rhythm-no-attempt");
  const noAttempt = calculateVerifiedResult(
    noAttemptRun,
    makeGameoverEvents(noAttemptRun, {
      rhythm: {
        rhythmAccuracy: 0,
        rhythmHitCount: 0,
        rhythmMissCount: 0,
        rhythmBonusHits: 0,
        rhythmBonusPoints: 0,
      },
    }),
    { clientFinishedAt: 5000 },
  );
  assert.equal(noAttempt.rhythmAccuracy, 0);
  assert.equal(noAttempt.rhythmMultiplier, 0.5);
  assert.equal(noAttempt.score, 11);
});

test("malformed rhythm summaries are rejected without trusting client score fields", () => {
  const cases = [
    ["RHYTHM_ACCURACY_INVALID", { rhythmAccuracy: 1.1 }],
    ["RHYTHM_COUNT_INVALID", { rhythmHitCount: -1 }],
    ["RHYTHM_BONUS_COUNT_INVALID", { rhythmHitCount: 0, rhythmBonusHits: 1 }],
    ["RHYTHM_BONUS_POINTS_INVALID", { rhythmHitCount: 1, rhythmBonusHits: 1, rhythmBonusPoints: 4 }],
    ["RHYTHM_COUNT_EXCESSIVE", { rhythmHitCount: 99, rhythmMissCount: 99 }],
  ];
  for (const [reason, rhythm] of cases) {
    const run = makeRun("rhythm-invalid-" + reason);
    const events = makeGameoverEvents(run, {
      rhythm: { ...rhythm, score: 999999, health: 999, distanceM: 999999 },
    });
    assert.throws(
      () => calculateVerifiedResult(run, events, { clientFinishedAt: 5000 }),
      (error) => error.code === "SCORE_EVENT_INVALID" && error.reason === reason,
    );
  }
});

test("server recalculates rhythm accuracy and rejects forged accuracy", () => {
  const run = makeRun("rhythm-accuracy-mismatch");
  const events = makeGameoverEvents(run, {
    rhythm: {
      rhythmAccuracy: 1,
      rhythmHitCount: 0,
      rhythmMissCount: 1,
      rhythmBonusHits: 0,
      rhythmBonusPoints: 0,
    },
  });
  assert.throws(
    () => calculateVerifiedResult(run, events, { clientFinishedAt: 5000 }),
    (error) => error.code === "SCORE_EVENT_INVALID" && error.reason === "RHYTHM_ACCURACY_MISMATCH",
  );
});

test("pattern v9 is validated when present and remains optional for legacy events", () => {
  const run = makeRun("pattern-version-seed");
  const mismatched = makeGameoverEvents(run);
  mismatched[0].payload.patternVersion = "cat-runner-patterns-v2";
  assert.throws(
    () => calculateVerifiedResult(run, mismatched, { clientFinishedAt: 5000 }),
    (error) => error.reason === "PATTERN_VERSION_INVALID",
  );
  const staleV4 = makeGameoverEvents(run);
  staleV4[0].payload.patternVersion = "cat-runner-patterns-v4";
  assert.throws(
    () => calculateVerifiedResult(run, staleV4, { clientFinishedAt: 5000 }),
    (error) => error.reason === "PATTERN_VERSION_INVALID",
  );

  const legacy = makeGameoverEvents(run);
  delete legacy[0].payload.patternVersion;
  assert.doesNotThrow(() =>
    calculateVerifiedResult(run, legacy, { clientFinishedAt: 5000 }),
  );
});

test("tampered, duplicated, out-of-order, and impossible events are rejected", () => {
  const cases = [
    ["ENTITY_UNKNOWN", (events) => { events[1].payload.entityId = "unknown"; }],
    ["ENTITY_TYPE_MISMATCH", (events, run) => {
      const obstacle = createServerManifest(run.seed).entities.find((entity) => entity.type === "obstacle");
      events[1].payload.entityId = obstacle.id;
    }],
    ["ENTITY_REPEATED", (events) => {
      events.splice(2, 0, { ...events[1], seq: 2, occurredAtMs: 150 });
      events.forEach((event, index) => { event.seq = index; });
    }],
    ["DISTANCE_INVALID", (events) => {
      events.splice(4, 0, { seq: 4, type: "distance_checkpoint", occurredAtMs: 350, payload: { distanceM: 2 } });
      events.forEach((event, index) => { event.seq = index; });
    }],
    ["TIME_IMPOSSIBLE", (events) => { events.at(-1).occurredAtMs = 9000; }],
    ["SEQ_OUT_OF_ORDER", (events) => { events[2].seq = 1; }],
  ];
  for (const [reason, mutate] of cases) {
    const run = makeRun("tamper-" + reason);
    const grass = createServerManifest(run.seed).entities.find(
      (entity) => entity.type === "grass" && effectFor(entity) !== "invincible",
    );
    const events = makeGameoverEvents(run, { grass });
    mutate(events, run);
    assert.throws(
      () => calculateVerifiedResult(run, events, { clientFinishedAt: 5000 }),
      (error) => error.code === "SCORE_EVENT_INVALID" && error.reason === reason,
    );
  }
});

test("double score and invincibility are recalculated from grass rolls", () => {
  const double = findSeedForEffect("double_score");
  const doubleRun = makeRun(double.seed);
  assert.equal(
    calculateVerifiedResult(doubleRun, makeGameoverEvents(doubleRun, { grass: double.grass, distanceM: 4 }), { clientFinishedAt: 10000 }).score,
    24,
  );

  const invincible = findSeedForEffect("invincible");
  const invincibleRun = makeRun(invincible.seed, "calico");
  const manifest = createServerManifest(invincible.seed);
  const obstacles = manifest.entities.filter((entity) => entity.type === "obstacle").slice(0, 6);
  const invincibleGap = manifest.gaps[0];
  const events = [
    {
      seq: 0,
      type: "run_started",
      occurredAtMs: 0,
      payload: {
        seed: invincible.seed,
        catId: "calico",
        patternVersion: PATTERN_VERSION,
      },
    },
    { seq: 1, type: "grass_collected", occurredAtMs: 100, payload: { entityId: invincible.grass.id, effectType: "invincible" } },
    { seq: 2, type: "fall_damage", occurredAtMs: 200, payload: { gapId: invincibleGap.id, damage: 999 } },
    ...obstacles.map((obstacle, index) => ({
      seq: index + 3,
      type: "obstacle_collision",
      occurredAtMs: index === 0 ? 200 : 6000 + index * 100,
      payload: { entityId: obstacle.id },
    })),
    { seq: 9, type: "run_gameover", occurredAtMs: 6500, payload: {} },
  ];
  assert.equal(calculateVerifiedResult(invincibleRun, events, { clientFinishedAt: 10000 }).health, 0);
});

test("server v9 manifest mirrors client route entities, gap ids, widths, and actions", async () => {
  const client = await import("../public/js/game/patterns.js");
  const world = await import("../public/js/game/world.js");
  const seed = "manifest-parity-seed";
  const server = createServerManifest(seed, { patternCount: 32 });
  const stream = client.createPatternStream(seed);
  const clientPatterns = [];

  for (let index = 0; index < 32; index += 1) {
    clientPatterns.push(stream.next("outside"));
  }

  assert.equal(server.version, client.PATTERN_VERSION);
  assert.equal(PATTERN_SPACING_FACTOR, world.PATTERN_SPACING_FACTOR);
  assert.ok(server.patterns.some((pattern) => pattern.id.startsWith("combo-")));
  assert.deepEqual(
    server.patterns.map((pattern) => pattern.id),
    clientPatterns.map((pattern) => pattern.id),
  );
  for (let index = 0; index < clientPatterns.length; index += 1) {
    const clientPattern = clientPatterns[index];
    const serverPattern = server.patterns[index];
    assert.equal(serverPattern.width, clientPattern.width);
    assert.deepEqual(
      serverPattern.entities.map((entity) => [
        entity.id,
        entity.type,
        entity.x - serverPattern.startX,
        entity.y,
        entity.width,
        entity.height,
        entity.minZone ?? null,
        entity.routeAction ?? null,
        entity.routeKind ?? null,
        entity.routeIndex ?? null,
        entity.routeSeedIndex ?? null,
        entity.formationId ?? null,
        entity.formationKind ?? null,
        entity.formationLetter ?? null,
        entity.formationSequenceIndex ?? null,
        entity.formationCell ?? null,
      ]),
      clientPattern.entities.map((entity) => [
        entity.id,
        entity.type,
        entity.x,
        entity.y,
        entity.width,
        entity.height,
        entity.minZone ?? null,
        entity.routeAction ?? null,
        entity.routeKind ?? null,
        entity.routeIndex ?? null,
        entity.routeSeedIndex ?? null,
        entity.formationId ?? null,
        entity.formationKind ?? null,
        entity.formationLetter ?? null,
        entity.formationSequenceIndex ?? null,
        entity.formationCell ?? null,
      ]),
    );
    assert.deepEqual(serverPattern.requiredActions, clientPattern.requiredActions);
    assert.deepEqual(serverPattern.actionCandidates, clientPattern.actionCandidates);
    assert.deepEqual(serverPattern.advancedSafeMargin, clientPattern.advancedSafeMargin);
    assert.equal(serverPattern.gapAction, clientPattern.gapAction);
    assert.equal(serverPattern.routeSpacing, clientPattern.routeSpacing);
    for (const clientGap of clientPattern.gaps) {
      const serverGap = server.getGap(clientGap.id);
      assert.ok(serverGap);
      assert.equal(serverGap.width, clientGap.width);
      assert.equal(serverGap.x - serverPattern.startX, clientGap.x);
    }
  }

  for (let index = 1; index < server.patterns.length; index += 1) {
    const previous = server.patterns[index - 1];
    const current = server.patterns[index];
    assert.equal(
      current.startX,
      previous.startX + previous.width +
        Math.max(previous.minGap * PATTERN_SPACING_FACTOR, 90 * 1.5),
    );
  }

  const homeDay = createServerManifest(seed, { patternCount: 32, zoneId: "home_day" });
  assert.ok(homeDay.patterns.every((pattern) => !pattern.id.startsWith("combo-")));
});

test("client and server preserve DEX cooldown metadata in every zone", async () => {
  const client = await import("../public/js/game/patterns.js");
  for (const zoneId of ["home_day", "outside", "home_night"]) {
    const seed = `dex-parity-${zoneId}`;
    const stream = client.createPatternStream(seed);
    const server = createServerManifest(seed, { patternCount: 192, zoneId });
    const clientPatterns = Array.from({ length: 192 }, () => stream.next(zoneId));
    const clientDexIndexes = [];
    const serverDexIndexes = [];

    for (let index = 0; index < clientPatterns.length; index += 1) {
      const clientPattern = clientPatterns[index];
      const serverPattern = server.patterns[index];
      assert.deepEqual(serverPattern.formation, clientPattern.formation);
      assert.equal(serverPattern.obstacleSuppressed, clientPattern.formation?.isDex === true);
      if (clientPattern.formation?.isDex) {
        clientDexIndexes.push(index);
      }
      if (serverPattern.formation?.isDex) {
        serverDexIndexes.push(index);
      }
    }

    assert.deepEqual(serverDexIndexes, clientDexIndexes);
    assert.ok(clientDexIndexes.length > 0);
    assert.ok(clientDexIndexes.every((index, position) =>
      position === 0 || index - clientDexIndexes[position - 1] >= 3,
    ));
  }
});

test("server manifest exposes formation metadata and obstacle-free DEX world entities", () => {
  const manifest = createServerManifest("dex-7", { patternCount: 128 });
  const normalPattern = manifest.patterns.find((pattern) =>
    pattern.formation && !pattern.formation.isDex,
  );
  const dexPattern = manifest.patterns.find((pattern) => pattern.formation?.isDex);
  assert.ok(normalPattern);
  assert.ok(dexPattern);
  assert.ok(normalPattern.entities.every((entity) =>
    entity.formationKind === undefined || entity.formationCell,
  ));

  const dexEntities = dexPattern.worldEntities.filter((entity) =>
    entity.formationId === "DEX",
  );
  assert.deepEqual(
    [...new Set(dexEntities.map((entity) => entity.formationLetter))],
    ["D", "E", "X"],
  );
  assert.equal(new Set(dexEntities.map((entity) => entity.id)).size, dexEntities.length);
  assert.ok(dexEntities.every((entity) => manifest.getEntity(entity.id) === entity));
  assert.equal(
    dexPattern.worldEntities.some((entity) =>
      entity.type === "obstacle" &&
      entity.x >= dexPattern.startX + dexPattern.formation.anchor.x &&
      entity.x < dexEntities.at(-1).x + dexEntities.at(-1).width,
    ),
    false,
  );
});

test("formation mouse events use the existing server score contract", () => {
  const run = makeRun("dex-7");
  const manifest = createServerManifest(run.seed);
  const formationMouse = manifest.entities.find((entity) => entity.formationKind);
  assert.ok(formationMouse);
  const result = calculateVerifiedResult(
    run,
    makeGameoverEvents(run, { mouse: formationMouse, distanceM: 4 }),
    { clientFinishedAt: 5000 },
  );
  assert.equal(result.mouseCount, 1);
  assert.equal(result.score, 14);
});

test("fall damage validates known gaps, ignores fake damage, and rejects replayed ids", () => {
  const run = makeRun("fall-validation-seed", "white");
  const manifest = createServerManifest(run.seed);
  const gaps = manifest.gaps.slice(0, 3);
  const events = [
    {
      seq: 0,
      type: "run_started",
      occurredAtMs: 0,
      payload: { seed: run.seed, catId: run.catId, patternVersion: PATTERN_VERSION },
    },
    ...gaps.map((gap, index) => ({
      seq: index + 1,
      type: "fall_damage",
      occurredAtMs: 100 + index * 100,
      payload: { gapId: gap.id, damage: 999, health: 999 },
    })),
    { seq: 4, type: "run_gameover", occurredAtMs: 600, payload: {} },
  ];

  const result = calculateVerifiedResult(run, events, { clientFinishedAt: 5000 });
  assert.equal(result.health, 0);

  const repeated = [...events];
  repeated[2] = { ...repeated[1], seq: 2, occurredAtMs: 150 };
  assert.throws(
    () => calculateVerifiedResult(run, repeated, { clientFinishedAt: 5000 }),
    (error) => error.reason === "GAP_REPEATED",
  );

  for (const [payload, reason] of [
    [{}, "GAP_INVALID"],
    [{ gapId: 42 }, "GAP_INVALID"],
    [{ gapId: "missing-gap" }, "GAP_UNKNOWN"],
  ]) {
    const invalid = [
      events[0],
      { seq: 1, type: "fall_damage", occurredAtMs: 100, payload },
      { seq: 2, type: "run_gameover", occurredAtMs: 200, payload: {} },
    ];
    assert.throws(
      () => calculateVerifiedResult(run, invalid, { clientFinishedAt: 5000 }),
      (error) => error.reason === reason,
    );
  }
});
