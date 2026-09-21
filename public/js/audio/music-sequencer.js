function createMusicSequencer(provider, options = {}) {
  const tempoMs = options.tempoMs || 600;
  const setIntervalFn = options.setIntervalFn || globalThis.setInterval;
  const clearIntervalFn = options.clearIntervalFn || globalThis.clearInterval;
  let intervalId = null;
  let noteIndex = 0;

  function playNext() {
    provider?.playMusicNote?.(noteIndex, options.volume ?? 0.12);
    noteIndex += 1;
  }

  function start() {
    if (intervalId !== null) {
      return;
    }
    playNext();
    intervalId = setIntervalFn(playNext, tempoMs);
  }

  function stop() {
    if (intervalId !== null) {
      clearIntervalFn(intervalId);
      intervalId = null;
    }
  }

  return {
    start,
    stop,
    isRunning: () => intervalId !== null,
  };
}

export { createMusicSequencer };
