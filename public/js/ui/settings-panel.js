function createSettingsPanel(audioManager, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  let root = null;
  let muteInput = null;
  let musicInput = null;
  let sfxInput = null;

  function makeRow(labelText, input) {
    const row = documentRef.createElement("label");
    row.className = "settings-row";
    const label = documentRef.createElement("span");
    label.textContent = labelText;
    row.append(label, input);
    return row;
  }

  function unlock() {
    audioManager?.unlock?.();
  }

  function sync() {
    const settings = audioManager?.getSettings?.();
    if (!settings) {
      return;
    }
    if (muteInput) {
      muteInput.checked = settings.muted;
    }
    if (musicInput) {
      musicInput.value = String(settings.musicVolume);
    }
    if (sfxInput) {
      sfxInput.value = String(settings.sfxVolume);
    }
  }

  function mount(nextRoot) {
    root = nextRoot;
    if (!root || !documentRef?.createElement) {
      return null;
    }
    const heading = documentRef.createElement("h3");
    heading.textContent = "소리 설정";
    muteInput = documentRef.createElement("input");
    muteInput.type = "checkbox";
    muteInput.addEventListener("change", () => {
      unlock();
      audioManager?.setMuted?.(muteInput.checked);
    });
    musicInput = documentRef.createElement("input");
    musicInput.type = "range";
    musicInput.min = "0";
    musicInput.max = "1";
    musicInput.step = "0.01";
    musicInput.addEventListener("input", () => {
      unlock();
      audioManager?.setMusicVolume?.(Number(musicInput.value));
    });
    sfxInput = documentRef.createElement("input");
    sfxInput.type = "range";
    sfxInput.min = "0";
    sfxInput.max = "1";
    sfxInput.step = "0.01";
    sfxInput.addEventListener("input", () => {
      unlock();
      audioManager?.setSfxVolume?.(Number(sfxInput.value));
    });
    root.append(
      heading,
      makeRow("음소거", muteInput),
      makeRow("배경음", musicInput),
      makeRow("효과음", sfxInput),
    );
    sync();
    return root;
  }

  function destroy() {
    root?.replaceChildren?.();
    root = null;
    muteInput = null;
    musicInput = null;
    sfxInput = null;
  }

  return { mount, sync, destroy };
}

export { createSettingsPanel };
