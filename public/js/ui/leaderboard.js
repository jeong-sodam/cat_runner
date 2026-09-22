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
        errorElement.textContent = "순위표를 불러오지 못했습니다. 다시 시도해주세요.";
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
    heading.textContent = "순위표";
    const intro = documentRef.createElement("p");
    intro.textContent = "상위 10개 개인 최고 기록";
    const table = documentRef.createElement("table");
    table.className = "leaderboard-table";
    const head = documentRef.createElement("thead");
    const headerRow = documentRef.createElement("tr");
    for (const label of ["순위", "고양이 이름", "이메일", "점수", "거리"]) {
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
    retryButton.textContent = "다시 시도";
    retryButton.hidden = true;
    retryButton.addEventListener("click", () => void load());
    const actions = documentRef.createElement("div");
    actions.className = "result-actions";
    const backButton = documentRef.createElement("button");
    backButton.type = "button";
    backButton.className = "game-button";
    backButton.textContent = "뒤로";
    backButton.addEventListener("click", () => callbacks.onBack?.());
    const restartButton = documentRef.createElement("button");
    restartButton.type = "button";
    restartButton.className = "game-button primary";
    restartButton.textContent = "캐릭터 선택";
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
