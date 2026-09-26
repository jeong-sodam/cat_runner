const LOCAL_RUN_KEY = "cat-runner:active-run";
const LOCAL_BEST_KEY = "cat-runner:local-best";
const LOCAL_SCORES_KEY = "cat-runner:local-scores";
const LOCAL_HISTORY_KEY = "cat-runner:local-history";
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
    return { storage, persistent: true };
  }
  try {
    if (globalThis.localStorage) {
      return { storage: globalThis.localStorage, persistent: true };
    }
  } catch {
    // Access to localStorage can be blocked by privacy mode or a sandbox.
  }
  return { storage: createMemoryStorage(), persistent: false };
}

function createLocalRunStore(storage) {
  const resolvedStorage = resolveStorage(storage);
  const safeStorage = resolvedStorage.storage;
  let persistent = resolvedStorage.persistent;
  let storageWarning = !resolvedStorage.persistent;
  let fallbackHistory = null;
  let fallbackLastResult = null;

  function readJson(key) {
    try {
      const raw = safeStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      persistent = false;
      storageWarning = true;
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      persistent = false;
      storageWarning = true;
      return false;
    }
  }

  function hasStoredValue(key) {
    try {
      return safeStorage.getItem(key) !== null;
    } catch {
      persistent = false;
      storageWarning = true;
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
    const rhythmAccuracy = numberOrZero(record?.rhythmAccuracy);
    const storedMultiplier = Number(record?.rhythmMultiplier);
    return {
      score: numberOrZero(record?.score),
      distanceM: numberOrZero(record?.distanceM),
      mouseCount: numberOrZero(record?.mouseCount),
      rhythmAccuracy,
      rhythmMultiplier: Number.isFinite(storedMultiplier)
        ? storedMultiplier
        : 0.5 + Math.min(1, Math.max(0, rhythmAccuracy)),
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
    return first.achievedAt - second.achievedAt;
  }

  function sameScoreRecord(first, second) {
    return Boolean(
      first &&
      second &&
      first.score === second.score &&
      first.distanceM === second.distanceM &&
      first.mouseCount === second.mouseCount &&
      first.rhythmAccuracy === second.rhythmAccuracy &&
      first.catId === second.catId &&
      first.achievedAt === second.achievedAt,
    );
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

  function persistHistory(history) {
    const normalizedHistory = history.map(normalizeScoreRecord);
    const historySaved = writeJson(LOCAL_HISTORY_KEY, normalizedHistory);
    const scoresSaved = writeJson(LOCAL_SCORES_KEY, normalizedHistory.slice(0, 5));
    if (historySaved && scoresSaved) {
      fallbackHistory = null;
      persistent = true;
      storageWarning = false;
      return true;
    }
    fallbackHistory = normalizedHistory;
    persistent = false;
    storageWarning = true;
    return false;
  }

  function readScoreArray(key) {
    const raw = readJson(key);
    if (raw === null && !hasStoredValue(key)) {
      return null;
    }
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .filter(isValidScoreRecord)
      .map(normalizeScoreRecord)
      .sort(compareScoreRecords);
  }

  function getLocalHistory() {
    const history = readScoreArray(LOCAL_HISTORY_KEY);
    if (history !== null) {
      return history;
    }

    if (fallbackHistory) {
      return [...fallbackHistory];
    }

    const legacyScores = readScoreArray(LOCAL_SCORES_KEY);
    if (legacyScores !== null) {
      persistHistory(legacyScores);
      return legacyScores;
    }

    const legacy = readLegacyBest();
    if (!legacy) {
      return [];
    }
    const migrated = [legacy];
    persistHistory(migrated);
    return migrated;
  }

  function getLocalScores() {
    return getLocalHistory().slice(0, 5);
  }

  function getLocalBest() {
    return getLocalScores()[0] || null;
  }

  function saveLocalResult(record) {
    const next = normalizeScoreRecord(record);
    const history = [...getLocalHistory(), next]
      .sort(compareScoreRecords)
    const saved = persistHistory(history);
    const rankIndex = history.findIndex((entry) => sameScoreRecord(entry, next));
    const entries = history.slice(0, 5);
    return {
      saved: saved || fallbackHistory !== null,
      persisted: saved,
      warning: storageWarning,
      ranked: rankIndex !== -1 && rankIndex < 5,
      rank: rankIndex === -1 ? null : rankIndex + 1,
      record: next,
      entries,
      totalEntries: history.length,
    };
  }

  function getLocalRank(record) {
    const target = normalizeScoreRecord(record);
    const rankIndex = getLocalHistory().findIndex((entry) => sameScoreRecord(entry, target));
    return rankIndex === -1 ? null : rankIndex + 1;
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
      return fallbackLastResult ? { ...fallbackLastResult } : null;
    }
    if (!isValidScoreRecord(record)) {
      clearLastResult();
      return null;
    }
    return normalizeScoreRecord(record);
  }

  function saveLastResult(record) {
    const next = normalizeScoreRecord(record);
    const saved = writeJson(LOCAL_LAST_RESULT_KEY, next);
    if (saved) {
      fallbackLastResult = null;
      if (fallbackHistory === null) {
        persistent = true;
        storageWarning = false;
      }
      return true;
    }
    fallbackLastResult = next;
    persistent = false;
    storageWarning = true;
    return true;
  }

  function getStorageStatus() {
    return {
      persistent,
      warning: storageWarning,
    };
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
      safeStorage.removeItem(LOCAL_HISTORY_KEY);
      safeStorage.removeItem(LOCAL_SCORES_KEY);
    } catch {
      // Storage is optional when private browsing blocks writes.
    }
  }

  function clearLocalBest() {
    try {
      safeStorage.removeItem(LOCAL_BEST_KEY);
      safeStorage.removeItem(LOCAL_HISTORY_KEY);
      safeStorage.removeItem(LOCAL_SCORES_KEY);
    } catch {
      // Storage is optional when private browsing blocks writes.
    }
  }

  return {
    save,
    load,
    clear,
    getLocalHistory,
    getLocalScores,
    getLocalRank,
    getLocalBest,
    saveLocalResult,
    saveLocalBest,
    getLastResult,
    saveLastResult,
    getStorageStatus,
    clearLocalScores,
    clearLocalBest,
    clearLastResult,
    key: LOCAL_RUN_KEY,
    bestKey: LOCAL_BEST_KEY,
    scoresKey: LOCAL_SCORES_KEY,
    historyKey: LOCAL_HISTORY_KEY,
    lastResultKey: LOCAL_LAST_RESULT_KEY,
  };
}

export {
  LOCAL_BEST_KEY,
  LOCAL_HISTORY_KEY,
  LOCAL_RUN_KEY,
  LOCAL_SCORES_KEY,
  LOCAL_LAST_RESULT_KEY,
  createLocalRunStore,
};
