const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createServerManifest } = require("../src/game/server-pattern-manifest");
const { calculateVerifiedResult } = require("../src/services/run-validation-service");

const EFFECTS = ["magnet", "invincible", "double_score", "slow_miss"];

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
  const obstacles = manifest.entities.filter((entity) => entity.type === "obstacle").slice(0, 3);
  const events = [{
    seq: 0,
    type: "run_started",
    occurredAtMs: 0,
    payload: { seed: run.seed, catId: run.catId, patternVersion: "cat-runner-patterns-v1" },
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
  events.push({ seq, type: "run_gameover", occurredAtMs: 700, payload: {} });
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
  const invincibleRun = makeRun(invincible.seed);
  const manifest = createServerManifest(invincible.seed);
  const obstacles = manifest.entities.filter((entity) => entity.type === "obstacle").slice(0, 4);
  const events = [
    { seq: 0, type: "run_started", occurredAtMs: 0, payload: { seed: invincible.seed, catId: "black" } },
    { seq: 1, type: "grass_collected", occurredAtMs: 100, payload: { entityId: invincible.grass.id, effectType: "invincible" } },
    ...obstacles.map((obstacle, index) => ({
      seq: index + 2,
      type: "obstacle_collision",
      occurredAtMs: index === 0 ? 200 : 6000 + index * 100,
      payload: { entityId: obstacle.id },
    })),
    { seq: 6, type: "run_gameover", occurredAtMs: 6500, payload: {} },
  ];
  assert.equal(calculateVerifiedResult(invincibleRun, events, { clientFinishedAt: 10000 }).health, 0);
});
