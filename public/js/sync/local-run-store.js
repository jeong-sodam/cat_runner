const LOCAL_RUN_KEY = "cat-runner:active-run";
const LOCAL_BEST_KEY = "cat-runner:local-best";
const LOCAL_SCORES_KEY = "cat-runner:local-scores";
const LOCAL_LAST_RESULT_KEY = "cat-runner:last-result";

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

  function readJson(key) {
    try {
      const raw = safeStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function hasStoredValue(key) {
    try {
      return safeStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

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

  function normalizeScoreRecord(record) {
    const numberOrZero = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    };
    const achievedAt = Number(record?.achievedAt);
    return {
      score: numberOrZero(record?.score),
      distanceM: numberOrZero(record?.distanceM),
      mouseCount: numberOrZero(record?.mouseCount),
      rhythmAccuracy: numberOrZero(record?.rhythmAccuracy),
      catId: typeof record?.catId === "string" && record.catId.length > 0
        ? record.catId
        : "black",
      achievedAt: Number.isFinite(achievedAt) ? achievedAt : Date.now(),
    };
  }

  function isValidScoreRecord(record) {
    return Boolean(
      record &&
      typeof record === "object" &&
      Number.isFinite(Number(record.score)),
    );
  }

  function compareScoreRecords(first, second) {
    if (first.score !== second.score) {
      return second.score - first.score;
    }
    if (first.distanceM !== second.distanceM) {
      return second.distanceM - first.distanceM;
    }
    return first.achievedAt - second.achievedAt;
  }

  function readLegacyBest() {
    const record = readJson(LOCAL_BEST_KEY);
    if (!record) {
      if (hasStoredValue(LOCAL_BEST_KEY)) {
        clearLocalBest();
      }
      return null;
    }
    if (!isValidScoreRecord(record)) {
      clearLocalBest();
      return null;
    }
    return normalizeScoreRecord(record);
  }

  function getLocalScores() {
    const raw = readJson(LOCAL_SCORES_KEY);
    if (raw !== null || hasStoredValue(LOCAL_SCORES_KEY)) {
      if (!Array.isArray(raw)) {
        clearLocalScores();
        return [];
      }
      return raw
        .filter(isValidScoreRecord)
        .map(normalizeScoreRecord)
        .sort(compareScoreRecords)
        .slice(0, 5);
    }

    const legacy = readLegacyBest();
    if (!legacy) {
      return [];
    }
    writeJson(LOCAL_SCORES_KEY, [legacy]);
    return [legacy];
  }

  function getLocalBest() {
    return getLocalScores()[0] || null;
  }

  function saveLocalResult(record) {
    const next = normalizeScoreRecord(record);
    const entries = [...getLocalScores(), next]
      .sort(compareScoreRecords)
      .slice(0, 5);
    const saved = writeJson(LOCAL_SCORES_KEY, entries);
    const rankIndex = entries.indexOf(next);
    return {
      saved,
      ranked: rankIndex !== -1,
      rank: rankIndex === -1 ? null : rankIndex + 1,
      record: next,
      entries,
    };
  }

  function saveLocalBest(record) {
    const next = normalizeScoreRecord(record);
    const current = getLocalBest();
    if (current && compareScoreRecords(next, current) >= 0) {
      return false;
    }
    const result = saveLocalResult(next);
    if (!result.saved) {
      return false;
    }
    writeJson(LOCAL_BEST_KEY, next);
    return true;
  }

  function getLastResult() {
    const record = readJson(LOCAL_LAST_RESULT_KEY);
    if (!record && !hasStoredValue(LOCAL_LAST_RESULT_KEY)) {
      return null;
    }
    if (!isValidScoreRecord(record)) {
      clearLastResult();
      return null;
    }
    return normalizeScoreRecord(record);
  }

  function saveLastResult(record) {
    return writeJson(LOCAL_LAST_RESULT_KEY, normalizeScoreRecord(record));
  }

  function clearLastResult() {
    try {
      safeStorage.removeItem(LOCAL_LAST_RESULT_KEY);
    } catch {
      // Storage is optional when private browsing blocks writes.
    }
  }

  function clearLocalScores() {
    try {
      safeStorage.removeItem(LOCAL_SCORES_KEY);
    } catch {
      // Storage is optional when private browsing blocks writes.
    }
  }

  function clearLocalBest() {
    try {
      safeStorage.removeItem(LOCAL_BEST_KEY);
      safeStorage.removeItem(LOCAL_SCORES_KEY);
    } catch {
      // Storage is optional when private browsing blocks writes.
    }
  }

  return {
    save,
    load,
    clear,
    getLocalScores,
    getLocalBest,
    saveLocalResult,
    saveLocalBest,
    getLastResult,
    saveLastResult,
    clearLocalScores,
    clearLocalBest,
    clearLastResult,
    key: LOCAL_RUN_KEY,
    bestKey: LOCAL_BEST_KEY,
    scoresKey: LOCAL_SCORES_KEY,
    lastResultKey: LOCAL_LAST_RESULT_KEY,
  };
}

export {
  LOCAL_BEST_KEY,
  LOCAL_RUN_KEY,
  LOCAL_SCORES_KEY,
  LOCAL_LAST_RESULT_KEY,
  createLocalRunStore,
};
