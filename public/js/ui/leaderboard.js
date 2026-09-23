import { CAT_DEFINITIONS } from "../game/constants.js";
import { fitSingleLineText } from "./text-fitting.js";

function createLeaderboardPanel(apiClient, callbacks = {}, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  const mode = options.mode || "server";
  const localStore = options.localStore || null;
  let root = null;
  let errorElement = null;
  let retryButton = null;
  let body = null;
  let currentResultElement = null;
  let emptyElement = null;

  function catLabel(catId) {
    return CAT_DEFINITIONS[catId]?.label || catId || "-";
  }

  function dateText(value) {
    const date = new Date(Number(value));
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString("ko-KR") : "-";
  }

  function appendCell(row, value) {
    const cell = documentRef.createElement("td");
    cell.textContent = String(value ?? "");
    row.append(cell);
  }

  function renderServerRows(entries) {
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

  function renderLocalRows(entries) {
    body?.replaceChildren?.();
    for (const [index, entry] of entries.entries()) {
      const row = documentRef.createElement("tr");
      row.dataset.catId = entry.catId || "black";
      appendCell(row, index + 1);
      appendCell(row, catLabel(entry.catId));
      appendCell(row, entry.score);
      appendCell(row, Number(entry.distanceM || 0).toLocaleString("ko-KR") + "m");
      appendCell(row, dateText(entry.achievedAt));
      body?.append(row);
    }
    if (emptyElement) {
      emptyElement.hidden = entries.length > 0;
    }
  }

  function renderCurrentResult(result) {
    if (!currentResultElement) {
      return;
    }
    currentResultElement.replaceChildren?.();
    if (!result) {
      currentResultElement.hidden = true;
      return;
    }
    currentResultElement.hidden = false;
    const heading = documentRef.createElement("h2");
    heading.textContent = "방금 기록";
    const summary = documentRef.createElement("p");
    summary.textContent = [
      catLabel(result.catId),
      "· 점수 " + String(result.score ?? 0),
      "· 거리 " + Number(result.distanceM || 0).toLocaleString("ko-KR") + "m",
    ].join(" ");
    currentResultElement.append(heading, summary);
  }

  function renderLocalState() {
    const entries = localStore?.getLocalScores?.() || [];
    const latest = options.currentResult || localStore?.getLastResult?.() || null;
    renderLocalRows(entries.slice(0, 5));
    renderCurrentResult(latest);
  }

  async function load() {
    if (mode === "local") {
      renderLocalState();
      return true;
    }
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
      renderServerRows(Array.isArray(payload?.entries) ? payload.entries.slice(0, 10) : []);
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
    heading.className = "fit-title";
    heading.textContent = "순위표";
    if (mode === "local") {
      const tabs = documentRef.createElement("div");
      tabs.className = "leaderboard-tabs";
      const personalTab = documentRef.createElement("button");
      personalTab.type = "button";
      personalTab.className = "leaderboard-tab active";
      personalTab.dataset.tab = "personal";
      personalTab.textContent = "내 점수순위";
      const globalTab = documentRef.createElement("button");
      globalTab.type = "button";
      globalTab.className = "leaderboard-tab";
      globalTab.dataset.tab = "global";
      globalTab.disabled = true;
      globalTab.setAttribute("aria-disabled", "true");
      globalTab.textContent = "전체 순위";
      tabs.append(personalTab, globalTab);
      const globalNote = documentRef.createElement("p");
      globalNote.className = "leaderboard-note";
      globalNote.textContent = "전체 순위는 로그인 후 제공됩니다.";
      section.append(tabs, globalNote);
    }
    const intro = documentRef.createElement("p");
    intro.textContent = mode === "local" ? "내 기록 상위 5개" : "상위 10개 개인 최고 기록";
    const table = documentRef.createElement("table");
    table.className = "leaderboard-table";
    const head = documentRef.createElement("thead");
    const headerRow = documentRef.createElement("tr");
    const headers = mode === "local"
      ? ["순위", "고양이", "점수", "거리", "달성일"]
      : ["순위", "고양이 이름", "이메일", "점수", "거리"];
    for (const label of headers) {
      const cell = documentRef.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      headerRow.append(cell);
    }
    head.append(headerRow);
    body = documentRef.createElement("tbody");
    table.append(head, body);
    emptyElement = documentRef.createElement("p");
    emptyElement.className = "leaderboard-empty";
    emptyElement.textContent = "아직 저장된 기록이 없습니다.";
    emptyElement.hidden = true;
    currentResultElement = documentRef.createElement("div");
    currentResultElement.className = "current-result";
    currentResultElement.hidden = true;
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
    section.append(heading, intro, table);
    if (mode === "local") {
      section.append(emptyElement, currentResultElement);
    }
    section.append(errorElement);
    if (mode !== "local") {
      section.append(retryButton);
    }
    section.append(actions);
    root.append(section);
    fitSingleLineText(heading, { container: section });
    void load();
    return section;
  }

  return { mount, load };
}

export { createLeaderboardPanel };
