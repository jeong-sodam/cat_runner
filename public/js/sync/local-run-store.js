const LOCAL_RUN_KEY = "cat-runner:active-run";

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

  return { save, load, clear, key: LOCAL_RUN_KEY };
}

export { LOCAL_RUN_KEY, createLocalRunStore };
