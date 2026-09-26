const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { createServerManifest } = require("../src/game/server-pattern-manifest");
const { createTestApp } = require("./helpers/fake-auth");

const fixtures = new Set();
const HEALTH_BY_CAT = Object.freeze({
  black: 2,
  white: 3,
  calico: 5,
  cheese: 3,
  mackerel: 2,
  chaos: 1,
});

async function startFixture(options = {}) {
  const fixture = await createTestApp(options);
  fixtures.add(fixture);
  return fixture;
}

async function completeRun(fixture, cookie, catId, distanceM) {
  const headers = { Cookie: cookie, "Content-Type": "application/json" };
  const created = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({ catId }),
  });
  assert.equal(created.status, 201);
  const run = await created.json();
  const manifest = createServerManifest(run.seed);
  const collisionCount = HEALTH_BY_CAT[catId] || 1;
  const obstacles = manifest.entities
    .filter((entity) => entity.type === "obstacle")
    .slice(0, collisionCount);
  const events = [
    {
      seq: 0,
      type: "run_started",
      occurredAtMs: 0,
      payload: { seed: run.seed, catId: run.catId },
    },
    {
      seq: 1,
      type: "distance_checkpoint",
      occurredAtMs: 100,
      payload: { distanceM },
    },
    ...obstacles.map((obstacle, index) => ({
      seq: index + 2,
      type: "obstacle_collision",
      occurredAtMs: 200 + index * 10,
      payload: { entityId: obstacle.id },
    })),
    {
      seq: obstacles.length + 2,
      type: "run_gameover",
      occurredAtMs: 240,
      payload: distanceM === 12
        ? {
            rhythmAccuracy: 0.5,
            rhythmHitCount: 1,
            rhythmMissCount: 1,
            rhythmBonusHits: 1,
            rhythmBonusPoints: 5,
          }
        : {},
    },
  ];
  const appended = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/events", {
    method: "POST",
    headers,
    body: JSON.stringify({ events }),
  });
  assert.equal(appended.status, 200);
  const completed = await fetch(fixture.baseUrl + "/api/runs/" + run.runId + "/complete", {
    method: "POST",
    headers,
    body: JSON.stringify({ events: [], clientFinishedAt: Date.now() }),
  });
  return { run, response: completed, payload: await completed.json() };
}

afterEach(async () => {
  for (const fixture of [...fixtures]) {
    await fixture.close();
    fixtures.delete(fixture);
  }
});

test("server manifest keeps an immediate route and staged gap guidance", () => {
  for (const zoneId of ["home_day", "outside", "home_night"]) {
    const manifest = createServerManifest(`integration-route-${zoneId}`, {
      patternCount: 64,
      zoneId,
    });
    const first = manifest.patterns[0];
    const firstRoute = first.entities.filter((entity) =>
      entity.type === "mouse" && entity.routeKind === "continuous",
    );
    assert.equal(first.startX, 1420);
    assert.ok(firstRoute.some((entity) => entity.x <= first.startX + 180));

    for (let index = 0; index < manifest.patterns.length; index += 1) {
      const pattern = manifest.patterns[index];
      if (index > 0) {
        const previous = manifest.patterns[index - 1];
        const bridge = pattern.bridgeEntities;
        assert.ok(bridge.every((entity, bridgeIndex) => {
          if (bridgeIndex === 0) {
            return true;
          }
          return entity.x - bridge[bridgeIndex - 1].x >= 34 &&
            entity.x - bridge[bridgeIndex - 1].x <= 42;
        }));
        assert.equal(
          pattern.startX,
          previous.startX + previous.width + Math.max(previous.minGap * 0.733, 135),
        );
      }
      assert.ok(pattern.gaps.length <= 1);
      for (const gap of pattern.gaps) {
        const route = pattern.entities.filter((entity) =>
          entity.type === "mouse" &&
          entity.routeKind === "continuous" &&
          entity.x + entity.width > gap.x - 135 &&
          entity.x < gap.x + gap.width + 135,
        );
        assert.ok(route.some((entity) => entity.routeAction === pattern.gapAction));
      }
    }

    if (zoneId === "home_day") {
      assert.ok(manifest.gaps.length === 0);
    } else {
      const widths = manifest.gaps.map((gap) => gap.width);
      assert.ok(widths.length > 0);
      const min = zoneId === "outside" ? 140 : 160;
      const max = zoneId === "outside" ? 180 : 220;
      assert.ok(widths.every((width) => width >= min && width <= max));
    }
  }
});

test("fake authenticated flow completes a run, keeps personal best, and expires resumable runs", async () => {
  const fixture = await startFixture({ now: Date.now() });
  const unauthenticated = await fetch(fixture.baseUrl + "/api/me");
  assert.deepEqual(await unauthenticated.json(), { authenticated: false });

  const cookie = await fixture.signIn();
  const headers = { Cookie: cookie, "Content-Type": "application/json" };
  const me = await fetch(fixture.baseUrl + "/api/me", { headers });
  assert.equal((await me.json()).authenticated, true);
  const nickname = await fetch(fixture.baseUrl + "/api/me/nickname", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ nickname: "Integration Cat" }),
  });
  assert.equal(nickname.status, 200);

  const first = await completeRun(fixture, cookie, "black", 12);
  assert.equal(first.response.status, 200);
  assert.equal(first.payload.result.score, 17);
  assert.equal(first.payload.result.rhythmAccuracy, 0.5);
  assert.equal(first.payload.result.rhythmMultiplier, 1);
  assert.equal(first.payload.result.rhythmBonusPoints, 5);
  assert.equal(first.payload.result.isPersonalBest, true);
  assert.equal(first.payload.result.rank, 1);

  const snapshotRun = await fetch(fixture.baseUrl + "/api/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({ catId: "white" }),
  });
  const resumableRun = await snapshotRun.json();
  const snapshot = await fetch(fixture.baseUrl + "/api/runs/" + resumableRun.runId + "/snapshot", {
    method: "PUT",
    headers,
    body: JSON.stringify({ snapshotVersion: 1, snapshot: { score: 2, distanceM: 2 } }),
  });
  assert.equal(snapshot.status, 200);

  const second = await completeRun(fixture, cookie, "chaos", 5);
  assert.equal(second.response.status, 200);
  assert.equal(second.payload.result.isPersonalBest, false);

  const leaderboard = await fetch(fixture.baseUrl + "/api/leaderboard", { headers });
  const leaderboardPayload = await leaderboard.json();
  assert.equal(leaderboardPayload.entries.length, 1);
  assert.equal(leaderboardPayload.entries[0].score, 17);
  assert.equal(leaderboardPayload.entries[0].email, "cat-a@example.com");

  fixture.clock.value += 24 * 60 * 60 * 1000 + 1;
  const resumable = await fetch(fixture.baseUrl + "/api/runs/resumable", { headers });
  assert.deepEqual((await resumable.json()).run, null);
});
