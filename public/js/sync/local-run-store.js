const LOCAL_RUN_KEY = "cat-runner:active-run";
const LOCAL_BEST_KEY = "cat-runner:local-best";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function resolveStorage(storage) {
  if (storage) {
    return storage;
  }
  try {
    return globalThis.localStorage || createMemoryStorage();
  } catch {
    return createMemoryStorage();
  }
}

function createLocalRunStore(storage) {
  const safeStorage = resolveStorage(storage);

  function save(run) {
    const value = {
      ...run,
      savedAt: run.savedAt || Date.now(),
    };
    try {
      safeStorage.setItem(LOCAL_RUN_KEY, JSON.stringify(value));
    } catch {
      return false;
    }
    return true;
  }

  function load() {
    try {
      const raw = safeStorage.getItem(LOCAL_RUN_KEY);
      if (!raw) {
        return null;
      }
      const run = JSON.parse(raw);
      if (!run || typeof run !== "object" || !run.runId || !run.userId) {
        clear();
        return null;
      }
      return run;
    } catch {
      clear();
      return null;
    }
  }

  function clear() {
    try {
      safeStorage.removeItem(LOCAL_RUN_KEY);
    } catch {
      // Storage is optional when private browsing blocks writes.
    }
  }

  function getLocalBest() {
    try {
      const raw = safeStorage.getItem(LOCAL_BEST_KEY);
      if (!raw) {
        return null;
      }
      const record = JSON.parse(raw);
      if (!record || typeof record !== "object" || !Number.isFinite(record.score)) {
        clearLocalBest();
        return null;
      }
      return record;
    } catch {
      clearLocalBest();
      return null;
    }
  }

  function isBetterBest(next, current) {
    if (!current) {
      return true;
    }
    if (next.score !== current.score) {
      return next.score > current.score;
    }
    if (next.distanceM !== current.distanceM) {
      return next.distanceM > current.distanceM;
    }
    return next.achievedAt < current.achievedAt;
  }

  function saveLocalBest(record) {
    const next = {
      score: Number(record?.score) || 0,
      distanceM: Number(record?.distanceM) || 0,
      mouseCount: Number(record?.mouseCount) || 0,
      rhythmAccuracy: Number(record?.rhythmAccuracy) || 0,
      catId: typeof record?.catId === "string" ? record.catId : "black",
      achievedAt: Number(record?.achievedAt) || Date.now(),
    };
    if (!isBetterBest(next, getLocalBest())) {
      return false;
    }
    try {
      safeStorage.setItem(LOCAL_BEST_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }

  function clearLocalBest() {
    try {
      safeStorage.removeItem(LOCAL_BEST_KEY);
    } catch {
      // Storage is optional when private browsing blocks writes.
    }
  }

  return {
    save,
    load,
    clear,
    getLocalBest,
    saveLocalBest,
    clearLocalBest,
    key: LOCAL_RUN_KEY,
    bestKey: LOCAL_BEST_KEY,
  };
}

export { LOCAL_BEST_KEY, LOCAL_RUN_KEY, createLocalRunStore };
