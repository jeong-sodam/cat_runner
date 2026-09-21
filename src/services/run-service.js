const crypto = require("node:crypto");
const runRepository = require("../db/repositories/run-repository");
const leaderboardRepository = require("../db/repositories/leaderboard-repository");
const { calculateVerifiedResult } = require("./run-validation-service");

const CAT_IDS = new Set([
  "black",
  "white",
  "calico",
  "cheese",
  "mackerel",
  "chaos",
]);
const RUN_TTL_MS = 24 * 60 * 60 * 1000;

function serviceError(code, message, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function assertCatId(catId) {
  if (!CAT_IDS.has(catId)) {
    throw serviceError("INVALID_CAT_ID", "A valid cat id is required.");
  }
}

function getOwnedRun(db, runId, userId, { requireActive = true, now = Date.now() } = {}) {
  const run = runRepository.findById(db, runId);
  if (!run || run.userId !== userId) {
    throw serviceError("RUN_NOT_FOUND", "Run not found.", 404);
  }
  if (requireActive && run.status !== "active") {
    throw serviceError("RUN_NOT_ACTIVE", "Run is not active.", 409);
  }
  if (requireActive && run.expiresAt <= now) {
    runRepository.abandonRun(db, runId, now);
    throw serviceError("RUN_EXPIRED", "Run has expired.", 410);
  }
  return run;
}

function startRun(
  db,
  { userId, catId, now = Date.now(), expiresAt = now + RUN_TTL_MS, idFactory, seedFactory } = {},
) {
  if (!Number.isInteger(userId)) {
    throw serviceError("USER_REQUIRED", "Authenticated user is required.", 401);
  }
  assertCatId(catId);
  const id = idFactory ? idFactory() : crypto.randomUUID();
  const seed = seedFactory ? seedFactory() : crypto.randomBytes(16).toString("hex");
  return runRepository.createRun(db, {
    id,
    userId,
    catId,
    seed,
    now,
    expiresAt,
  });
}

function appendRunEvents(db, { runId, userId, events, now = Date.now() } = {}) {
  getOwnedRun(db, runId, userId, { now });
  try {
    const accepted = runRepository.appendEvents(db, runId, events, now);
    return {
      acceptedThroughSeq: accepted.length ? accepted[accepted.length - 1].seq : -1,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw serviceError("INVALID_RUN_EVENTS", error.message);
    }
    if (/event sequence|not active/.test(error.message)) {
      throw serviceError("INVALID_RUN_EVENTS", error.message, 409);
    }
    throw error;
  }
}

function saveRunSnapshot(
  db,
  { runId, userId, snapshotVersion, snapshot, now = Date.now() } = {},
) {
  getOwnedRun(db, runId, userId, { now });
  if (snapshotVersion !== 1 || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw serviceError("INVALID_RUN_SNAPSHOT", "Snapshot version 1 and an object snapshot are required.");
  }
  try {
    JSON.stringify(snapshot);
  } catch {
    throw serviceError("INVALID_RUN_SNAPSHOT", "Snapshot must be serializable.");
  }
  const saved = runRepository.saveSnapshot(db, runId, snapshot, now);
  if (!saved) {
    throw serviceError("RUN_NOT_ACTIVE", "Run is not active.", 409);
  }
  return saved;
}

function getResumableRun(db, userId, { now = Date.now() } = {}) {
  runRepository.expireActiveRuns(db, now);
  const run = runRepository.findResumableRun(db, userId, now);
  if (!run) {
    return null;
  }
  return {
    ...run,
    events: runRepository.findEvents(db, run.id),
  };
}

function abandonRun(db, { runId, userId, now = Date.now() } = {}) {
  getOwnedRun(db, runId, userId, { requireActive: false, now });
  const abandoned = runRepository.abandonRun(db, runId, now);
  return abandoned || runRepository.findById(db, runId);
}

function completeVerifiedRun(
  db,
  {
    runId,
    userId,
    events = [],
    clientFinishedAt,
    now = Date.now(),
  } = {},
  ) {
  const run = getOwnedRun(db, runId, userId, { now });
  const existingEvents = runRepository.findEvents(db, runId);
  if (!Array.isArray(events)) {
    const invalid = serviceError("SCORE_EVENT_INVALID", "Events must be an array.", 422);
    invalid.reason = "EVENT_BATCH_INVALID";
    throw invalid;
  }
  const allEvents = existingEvents.concat(events);
  let verified;
  try {
    verified = calculateVerifiedResult(run, allEvents, { clientFinishedAt });
  } catch (error) {
    if (error.code === "SCORE_EVENT_INVALID") {
      throw error;
    }
    throw serviceError("SCORE_EVENT_INVALID", error.message, 422);
  }

  if (events.length) {
    try {
      runRepository.appendEvents(db, runId, events, now);
    } catch (error) {
      const invalid = serviceError("SCORE_EVENT_INVALID", error.message, 422);
      invalid.reason = /sequence/.test(error.message) ? "SEQ_REPLAYED" : "EVENT_APPEND_FAILED";
      throw invalid;
    }
  }
  const completed = runRepository.completeRun(db, runId, {
    score: verified.score,
    distanceM: verified.distanceM,
    mouseCount: verified.mouseCount,
    completedAt: now,
  });
  if (!completed) {
    throw serviceError("RUN_NOT_ACTIVE", "Run is not active.", 409);
  }
  const previousBest = leaderboardRepository.getBestScore(db, userId);
  leaderboardRepository.upsertIfBetter(db, userId, {
    score: verified.score,
    distanceM: verified.distanceM,
    achievedAt: now,
  });
  const isPersonalBest =
    !previousBest ||
    verified.score > previousBest.score ||
    (verified.score === previousBest.score && verified.distanceM > previousBest.distanceM) ||
    (verified.score === previousBest.score &&
      verified.distanceM === previousBest.distanceM &&
      now < previousBest.achievedAt);
  return {
    accepted: true,
    result: {
      score: verified.score,
      distanceM: verified.distanceM,
      mouseCount: verified.mouseCount,
      isPersonalBest,
      rank: leaderboardRepository.getRankForUser(db, userId),
    },
  };
}

module.exports = {
  CAT_IDS,
  RUN_TTL_MS,
  abandonRun,
  appendRunEvents,
  completeVerifiedRun,
  getResumableRun,
  saveRunSnapshot,
  startRun,
};
