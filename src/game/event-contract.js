const EVENT_TYPES = Object.freeze([
  "run_started",
  "player_jump",
  "slide_start",
  "slide_end",
  "mouse_collected",
  "grass_collected",
  "obstacle_collision",
  "distance_checkpoint",
  "run_gameover",
]);
const EVENT_TYPE_SET = new Set(EVENT_TYPES);

function contractError(reason, message) {
  const error = new Error(message || reason);
  error.code = "SCORE_EVENT_INVALID";
  error.reason = reason;
  error.status = 422;
  return error;
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
