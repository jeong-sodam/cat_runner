import { createMusicSequencer } from "./music-sequencer.js";
import { createWebAudioProvider } from "./sound-provider.js";

const SETTINGS_KEY = "cat-runner:audio-settings";
const DEFAULT_SETTINGS = {
  muted: false,
  musicVolume: 0.6,
  sfxVolume: 0.8,
};

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function clamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.max(0, Math.min(1, number));
}

function readSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      muted: Boolean(parsed.muted),
      musicVolume: clamp(parsed.musicVolume ?? DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function createAudioManager(storage, options = {}) {
  const safeStorage = storage || globalThis.localStorage || createMemoryStorage();
  let settings = readSettings(safeStorage);
  let audioContext = null;
  let provider = null;
  let musicSequencer = null;
  let unlockAttempted = false;
  let musicRequested = false;

  function persist() {
    try {
      safeStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Storage is optional; audio must remain usable when it is blocked.
    }
  }

  function contextFactory() {
    if (options.audioContextFactory) {
      return options.audioContextFactory();
    }
    const AudioContextConstructor =
      globalThis.AudioContext || globalThis.webkitAudioContext;
    return AudioContextConstructor ? new AudioContextConstructor() : null;
  }

  async function unlock() {
    if (provider) {
      return true;
    }
    if (unlockAttempted) {
      return false;
    }
    unlockAttempted = true;
    try {
      audioContext = contextFactory();
      if (!audioContext) {
        return false;
      }
      if (audioContext.resume) {
        await audioContext.resume();
      }
      provider = options.providerFactory
        ? options.providerFactory(audioContext)
        : createWebAudioProvider(audioContext);
      if (!provider) {
        return false;
      }
      if (musicRequested && !settings.muted) {
        startMusicNow();
      }
      return true;
    } catch {
      provider = null;
      audioContext = null;
      return false;
    }
  }

  function startMusicNow() {
    if (!provider || settings.muted || musicSequencer?.isRunning?.()) {
      return;
    }
    if (!musicSequencer) {
      musicSequencer = options.musicSequencerFactory
        ? options.musicSequencerFactory(provider)
        : createMusicSequencer(provider, {
            volume: settings.musicVolume * 0.2,
          });
    }
    musicSequencer.start?.();
  }

  function startMusic() {
    musicRequested = true;
    startMusicNow();
  }

  function stopMusic() {
    musicRequested = false;
    musicSequencer?.stop?.();
  }

  function setMusicVolume(value) {
    settings.musicVolume = clamp(value);
    persist();
  }

  function setSfxVolume(value) {
    settings.sfxVolume = clamp(value);
    persist();
  }

  function setMuted(value) {
    settings.muted = Boolean(value);
    persist();
    if (settings.muted) {
      musicSequencer?.stop?.();
      provider?.stopAll?.();
    } else if (musicRequested) {
      startMusicNow();
    }
  }

  function playSfx(name) {
    if (settings.muted || !provider) {
      return;
    }
    try {
      provider.play?.(name, settings.sfxVolume);
    } catch {
      // A provider failure must not interrupt gameplay.
    }
  }

  function destroy() {
    musicSequencer?.stop?.();
    provider?.destroy?.();
    audioContext?.close?.();
    musicSequencer = null;
    provider = null;
    audioContext = null;
  }

  return {
    unlock,
    playSfx,
    startMusic,
    stopMusic,
    setMusicVolume,
    setSfxVolume,
    setMuted,
    getSettings: () => ({ ...settings }),
    isUnlocked: () => Boolean(provider),
    destroy,
  };
}

export { DEFAULT_SETTINGS, SETTINGS_KEY, createAudioManager };
