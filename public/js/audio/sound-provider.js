const SFX_FREQUENCIES = {
  jump: 520,
  mouse: 760,
  grass: 420,
  effect: 680,
  collision: 150,
  gameover: 90,
  pause: 280,
  resume: 560,
};

function createWebAudioProvider(audioContext) {
  function playTone(frequency, volume, durationMs, type = "sine") {
    if (!audioContext?.createOscillator || !audioContext?.createGain) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startTime = Number.isFinite(audioContext.currentTime)
      ? audioContext.currentTime
      : 0;
    const endTime = startTime + durationMs / 1000;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime?.(frequency, startTime);
    gain.gain.setValueAtTime?.(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime?.(
      Math.max(0.0001, volume),
      startTime + 0.01,
    );
    gain.gain.exponentialRampToValueAtTime?.(0.0001, endTime);
    oscillator.connect?.(gain);
    gain.connect?.(audioContext.destination);
    oscillator.start?.(startTime);
    oscillator.stop?.(endTime);
  }

  return {
    play(name, volume = 1) {
      const frequency = SFX_FREQUENCIES[name] || 300;
      const type = name === "collision" || name === "gameover" ? "sawtooth" : "sine";
      playTone(frequency, Math.max(0, Math.min(1, volume)), 100, type);
    },

    playMusicNote(index, volume = 0.1) {
      const melody = [262, 330, 392, 330, 294, 349, 440, 349];
      const frequency = melody[Math.abs(index) % melody.length];
      playTone(frequency, Math.max(0, Math.min(1, volume)), 360, "triangle");
    },

    stopAll() {
      // Short envelopes self-clean; this hook lets file-based providers stop longer sounds.
    },

    destroy() {
      this.stopAll();
    },
  };
}

export { createWebAudioProvider };
