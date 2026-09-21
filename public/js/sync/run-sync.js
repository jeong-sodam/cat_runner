const RETRY_DELAYS_MS = [500, 1000, 2000, 4000, 5000];

function createRunSync(apiClient, localStore, options = {}) {
  const now = options.now || (() => Date.now());
  const setTimeoutFn = options.setTimeoutFn || globalThis.setTimeout;
  const clearTimeoutFn = options.clearTimeoutFn || globalThis.clearTimeout;
  const autoRetry = options.autoRetry !== false;
  let activeRun = null;
  let offline = false;
  let flushing = false;
  let retryCount = 0;
  let retryTimer = null;

  function persist() {
    if (activeRun) {
      activeRun.savedAt = now();
      localStore.save(activeRun);
    }
  }

  function notifyOffline(error) {
    options.onOffline?.(error, getState());
  }

  function markOffline(error) {
    const wasOffline = offline;
    offline = true;
    persist();
    if (!wasOffline) {
      notifyOffline(error);
    }
    scheduleRetry();
  }

  function scheduleRetry() {
    if (retryTimer !== null || !autoRetry) {
      return;
    }
    const delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
    retryCount += 1;
    retryTimer = setTimeoutFn(() => {
      retryTimer = null;
      void flush();
    }, delay);
  }

  function clearRetry() {
    if (retryTimer !== null) {
      clearTimeoutFn(retryTimer);
      retryTimer = null;
    }
    retryCount = 0;
  }

  async function startRun({ userId, catId, snapshot = null } = {}) {
    const result = await apiClient.startRun({ userId, catId });
    activeRun = {
      runId: result.runId,
      userId,
      catId: result.catId || catId,
      seed: result.seed,
      expiresAt: result.expiresAt,
      snapshotVersion: 1,
      snapshot,
      pendingEvents: [
        {
          seq: 0,
          type: "run_started",
          occurredAtMs: 0,
          payload: { seed: result.seed, catId: result.catId || catId },
        },
      ],
      savedAt: now(),
    };
    offline = false;
    retryCount = 0;
    persist();
    return { ...activeRun };
  }

  function recordEvent(type, occurredAtMs, payload = {}) {
    if (!activeRun) {
      return null;
    }
    const lastEvent = activeRun.pendingEvents[activeRun.pendingEvents.length - 1];
    const previousSeq = lastEvent ? lastEvent.seq : activeRun.lastAcknowledgedSeq ?? -1;
    const event = {
      seq: previousSeq + 1,
      type,
      occurredAtMs: Math.max(0, Math.round(occurredAtMs)),
      payload: payload && typeof payload === "object" ? payload : {},
    };
    activeRun.pendingEvents.push(event);
    persist();
    return event;
  }

  function saveSnapshot(snapshot) {
    if (!activeRun || !snapshot || typeof snapshot !== "object") {
      return false;
    }
    activeRun.snapshotVersion = 1;
    activeRun.snapshot = snapshot;
    persist();
    return true;
  }

  async function flush() {
    if (!activeRun || offline || flushing) {
      return false;
    }
    flushing = true;
    try {
      if (activeRun.pendingEvents.length) {
        const result = await apiClient.appendEvents(
          activeRun.runId,
          activeRun.pendingEvents.map((event) => ({ ...event })),
        );
        const acceptedThroughSeq = Number.isInteger(result?.acceptedThroughSeq)
          ? result.acceptedThroughSeq
          : activeRun.pendingEvents[activeRun.pendingEvents.length - 1].seq;
        activeRun.pendingEvents = activeRun.pendingEvents.filter(
          (event) => event.seq > acceptedThroughSeq,
        );
        activeRun.lastAcknowledgedSeq = Math.max(
          activeRun.lastAcknowledgedSeq ?? -1,
          acceptedThroughSeq,
        );
      }
      if (activeRun.snapshot) {
        await apiClient.saveSnapshot(
          activeRun.runId,
          activeRun.snapshotVersion,
          activeRun.snapshot,
        );
      }
      offline = false;
      clearRetry();
      persist();
      return true;
    } catch (error) {
      markOffline(error);
      return false;
    } finally {
      flushing = false;
    }
  }

  async function handleOnline() {
    if (!activeRun) {
      offline = false;
      options.onOnline?.(getState());
      return true;
    }
    offline = false;
    const flushed = await flush();
    if (flushed) {
      options.onOnline?.(getState());
    }
    return flushed;
  }

  function handleOffline(snapshot) {
    saveSnapshot(snapshot);
    markOffline(new Error("Network is offline."));
  }

  function getLocalResumeCandidate(serverRun, userId = serverRun?.userId) {
    const localRun = localStore.load();
    if (!serverRun || !localRun) {
      return null;
    }
    if (serverRun.expiresAt <= now() || localRun.expiresAt <= now()) {
      return null;
    }
    if (localRun.runId !== serverRun.runId || localRun.userId !== userId) {
      return null;
    }
    return { serverRun, localRun };
  }

  function continueRun(candidate) {
    if (!candidate?.serverRun || !candidate?.localRun) {
      return null;
    }
    activeRun = {
      ...candidate.localRun,
      seed: candidate.serverRun.seed,
      catId: candidate.serverRun.catId,
      expiresAt: candidate.serverRun.expiresAt,
      snapshot: candidate.localRun.snapshot || candidate.serverRun.snapshot,
      pendingEvents: [...(candidate.localRun.pendingEvents || [])],
    };
    const serverEvents = candidate.serverRun.events || [];
    const lastServerSeq = serverEvents.length
      ? serverEvents[serverEvents.length - 1].seq
      : -1;
    activeRun.lastAcknowledgedSeq = Math.max(
      activeRun.lastAcknowledgedSeq ?? -1,
      lastServerSeq,
    );
    activeRun.pendingEvents = activeRun.pendingEvents.filter(
      (event) => event.seq > activeRun.lastAcknowledgedSeq,
    );
    offline = false;
    persist();
    return { ...activeRun };
  }

  async function abandon() {
    if (activeRun) {
      await apiClient.abandonRun(activeRun.runId);
    }
    localStore.clear();
    clearRetry();
    activeRun = null;
    offline = false;
  }

  function complete() {
    localStore.clear();
    clearRetry();
    activeRun = null;
    offline = false;
  }

  function getState() {
    return {
      activeRun: activeRun ? { ...activeRun, pendingEvents: [...activeRun.pendingEvents] } : null,
      offline,
      flushing,
    };
  }

  function destroy() {
    clearRetry();
  }

  return {
    startRun,
    recordEvent,
    saveSnapshot,
    flush,
    handleOffline,
    handleOnline,
    getLocalResumeCandidate,
    continueRun,
    abandon,
    complete,
    getState,
    destroy,
  };
}

export { RETRY_DELAYS_MS, createRunSync };
