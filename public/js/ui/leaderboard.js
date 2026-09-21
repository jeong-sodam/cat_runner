function createLeaderboardPanel(apiClient, callbacks = {}, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  let root = null;
  let errorElement = null;
  let retryButton = null;
  let body = null;

  function renderRows(entries) {
    body?.replaceChildren?.();
    for (const entry of entries) {
      const row = documentRef.createElement("tr");
      for (const value of [
        entry.rank,
        entry.nickname,
        entry.email,
        entry.score,
        entry.distanceM,
      ]) {
        const cell = documentRef.createElement("td");
        cell.textContent = String(value ?? "");
        row.append(cell);
      }
      body?.append(row);
    }
  }

  async function load() {
    if (!apiClient?.getLeaderboard) {
      return false;
    }
    if (errorElement) {
      errorElement.hidden = true;
    }
    if (retryButton) {
      retryButton.hidden = true;
    }
    try {
      const payload = await apiClient.getLeaderboard();
      renderRows(Array.isArray(payload?.entries) ? payload.entries.slice(0, 10) : []);
      return true;
    } catch {
      if (errorElement) {
        errorElement.textContent = "Leaderboard could not be loaded. Try again.";
        errorElement.hidden = false;
      }
      if (retryButton) {
        retryButton.hidden = false;
      }
      return false;
    }
  }

  function mount(nextRoot) {
    root = nextRoot;
    if (!root || !documentRef?.createElement) {
      return null;
    }
    root.replaceChildren();
    root.hidden = false;
    const section = documentRef.createElement("section");
    section.className = "flow-card wide-card leaderboard-screen";
    const heading = documentRef.createElement("h1");
    heading.textContent = "Leaderboard";
    const intro = documentRef.createElement("p");
    intro.textContent = "Top ten personal best scores";
    const table = documentRef.createElement("table");
    table.className = "leaderboard-table";
    const head = documentRef.createElement("thead");
    const headerRow = documentRef.createElement("tr");
    for (const label of ["Rank", "Cat name", "Email", "Score", "Distance"]) {
      const cell = documentRef.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      headerRow.append(cell);
    }
    head.append(headerRow);
    body = documentRef.createElement("tbody");
    table.append(head, body);
    errorElement = documentRef.createElement("p");
    errorElement.className = "form-error";
    errorElement.hidden = true;
    retryButton = documentRef.createElement("button");
    retryButton.type = "button";
    retryButton.className = "game-button primary";
    retryButton.textContent = "Retry";
    retryButton.hidden = true;
    retryButton.addEventListener("click", () => void load());
    const actions = documentRef.createElement("div");
    actions.className = "result-actions";
    const backButton = documentRef.createElement("button");
    backButton.type = "button";
    backButton.className = "game-button";
    backButton.textContent = "Back";
    backButton.addEventListener("click", () => callbacks.onBack?.());
    const restartButton = documentRef.createElement("button");
    restartButton.type = "button";
    restartButton.className = "game-button primary";
    restartButton.textContent = "Choose cat";
    restartButton.addEventListener("click", () => callbacks.onRestart?.());
    actions.append(backButton, restartButton);
    section.append(heading, intro, table, errorElement, retryButton, actions);
    root.append(section);
    void load();
    return section;
  }

  return { mount, load };
}

export { createLeaderboardPanel };
