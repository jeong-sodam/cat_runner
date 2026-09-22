const EVENT_TYPES = Object.freeze([
  "run_started",
  "player_jump",
  "slide_start",
  "slide_end",
  "mouse_collected",
  "grass_collected",
  "obstacle_collision",
  "fall_damage",
  "distance_checkpoint",
  "run_gameover",
]);
const EVENT_TYPE_SET = new Set(EVENT_TYPES);
const RHYTHM_FIELDS = Object.freeze([
  "rhythmAccuracy",
  "rhythmHitCount",
  "rhythmMissCount",
  "rhythmBonusHits",
  "rhythmBonusPoints",
]);

function contractError(reason, message) {
  const error = new Error(message || reason);
  error.code = "SCORE_EVENT_INVALID";
  error.reason = reason;
  error.status = 422;
  return error;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function validateRhythmPayload(payload) {
  const hasRhythmSummary = RHYTHM_FIELDS.some((field) => hasOwn(payload, field));
  if (!hasRhythmSummary) {
    return;
  }
  if (hasOwn(payload, "rhythmAccuracy") &&
      (!Number.isFinite(payload.rhythmAccuracy) || payload.rhythmAccuracy < 0 || payload.rhythmAccuracy > 1)) {
    throw contractError("RHYTHM_ACCURACY_INVALID", "Rhythm accuracy must be a finite number between 0 and 1.");
  }
  for (const field of ["rhythmHitCount", "rhythmMissCount", "rhythmBonusHits"]) {
    if (hasOwn(payload, field) && (!Number.isInteger(payload[field]) || payload[field] < 0)) {
      throw contractError("RHYTHM_COUNT_INVALID", "Rhythm counts must be non-negative integers.");
    }
  }
  if (hasOwn(payload, "rhythmBonusPoints") &&
      (!Number.isInteger(payload.rhythmBonusPoints) || payload.rhythmBonusPoints < 0)) {
    throw contractError("RHYTHM_BONUS_INVALID", "Rhythm bonus points must be a non-negative integer.");
  }
  const hitCount = payload.rhythmHitCount ?? 0;
  const bonusHits = payload.rhythmBonusHits ?? 0;
  if (bonusHits > hitCount) {
    throw contractError("RHYTHM_BONUS_COUNT_INVALID", "Rhythm bonus hits cannot exceed hit count.");
  }
  if (hasOwn(payload, "rhythmBonusPoints") && payload.rhythmBonusPoints !== bonusHits * 5) {
    throw contractError("RHYTHM_BONUS_POINTS_INVALID", "Rhythm bonus points must equal bonus hits multiplied by 5.");
  }
}

function validateEvent(event, context = {}) {
  if (!event || typeof event !== "object") {
    throw contractError("EVENT_SHAPE", "Event must be an object.");
  }
  if (!Number.isInteger(event.seq) || event.seq < 0) {
    throw contractError("SEQ_INVALID", "Event sequence must be a non-negative integer.");
  }
  if (context.expectedSeq !== undefined && event.seq !== context.expectedSeq) {
    throw contractError("SEQ_OUT_OF_ORDER", "Event sequence is not contiguous.");
  }
  if (!EVENT_TYPE_SET.has(event.type)) {
    throw contractError("EVENT_TYPE_INVALID", "Event type is not allowed.");
  }
  if (!Number.isInteger(event.occurredAtMs) || event.occurredAtMs < 0) {
    throw contractError("TIME_INVALID", "Event time must be a non-negative integer.");
  }
  if (
    context.previousOccurredAtMs !== undefined &&
    event.occurredAtMs < context.previousOccurredAtMs
  ) {
    throw contractError("TIME_OUT_OF_ORDER", "Event time cannot decrease.");
  }
  if (context.maxOccurredAtMs !== undefined && event.occurredAtMs > context.maxOccurredAtMs) {
    throw contractError("TIME_IMPOSSIBLE", "Event time exceeds the run duration.");
  }
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) {
    throw contractError("PAYLOAD_INVALID", "Event payload must be an object.");
  }
  if (event.type === "run_gameover") {
    validateRhythmPayload(event.payload);
  }
  return event;
}

function validateEventBatch(events, context = {}) {
  if (!Array.isArray(events)) {
    throw contractError("EVENT_BATCH_INVALID", "Events must be an array.");
  }
  let expectedSeq = context.startingSeq ?? 0;
  let previousOccurredAtMs = context.previousOccurredAtMs ?? -1;
  for (const event of events) {
    validateEvent(event, {
      expectedSeq,
      previousOccurredAtMs,
      maxOccurredAtMs: context.maxOccurredAtMs,
    });
    expectedSeq += 1;
    previousOccurredAtMs = event.occurredAtMs;
  }
  return events;
}

module.exports = { EVENT_TYPES, contractError, validateEvent, validateEventBatch };
