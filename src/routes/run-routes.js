const { requireAuth } = require("../auth/auth-middleware");
const runService = require("../services/run-service");

function publicRun(run) {
  return {
    runId: run.id,
    catId: run.catId,
    seed: run.seed,
    status: run.status,
    score: run.score,
    distanceM: run.distanceM,
    mouseCount: run.mouseCount,
    snapshot: run.snapshot,
    events: run.events,
    startedAt: run.startedAt,
    updatedAt: run.updatedAt,
    expiresAt: run.expiresAt,
  };
}

function userIdFrom(request) {
  return request.session.user.userId;
}

function registerRunRoutes(app, dependencies = {}) {
  const service = dependencies.runService || runService;
  const now = () => (dependencies.clock ? dependencies.clock.now() : Date.now());

  app.post("/api/runs", requireAuth, (request, response, next) => {
    try {
      const run = service.startRun(dependencies.db, {
        userId: userIdFrom(request),
        catId: request.body?.catId,
        now: now(),
      });
      return response.status(201).json({
        runId: run.id,
        seed: run.seed,
        catId: run.catId,
        expiresAt: run.expiresAt,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/runs/resumable", requireAuth, (request, response, next) => {
    try {
      const run = service.getResumableRun(dependencies.db, userIdFrom(request), { now: now() });
      return response.json({ run: run ? publicRun(run) : null });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/runs/:runId/events", requireAuth, (request, response, next) => {
    try {
      const result = service.appendRunEvents(dependencies.db, {
        runId: request.params.runId,
        userId: userIdFrom(request),
        events: request.body?.events,
        now: now(),
      });
      return response.json(result);
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/runs/:runId/snapshot", requireAuth, (request, response, next) => {
    try {
      const run = service.saveRunSnapshot(dependencies.db, {
        runId: request.params.runId,
        userId: userIdFrom(request),
        snapshotVersion: request.body?.snapshotVersion,
        snapshot: request.body?.snapshot,
        now: now(),
      });
      return response.json({
        runId: run.id,
        updatedAt: run.updatedAt,
        expiresAt: run.expiresAt,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/runs/:runId/abandon", requireAuth, (request, response, next) => {
    try {
      const run = service.abandonRun(dependencies.db, {
        runId: request.params.runId,
        userId: userIdFrom(request),
        now: now(),
      });
      return response.json({ runId: run.id, status: run.status });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/runs/:runId/complete", requireAuth, (request, response, next) => {
    try {
      const result = service.completeVerifiedRun(dependencies.db, {
        runId: request.params.runId,
        userId: userIdFrom(request),
        events: request.body?.events,
        clientFinishedAt: request.body?.clientFinishedAt,
        now: now(),
      });
      return response.json(result);
    } catch (error) {
      return next(error);
    }
  });
}

module.exports = { registerRunRoutes };
