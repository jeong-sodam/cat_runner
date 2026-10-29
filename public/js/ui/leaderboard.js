import { CAT_DEFINITIONS } from "../game/constants.js";
import { fitSingleLineText } from "./text-fitting.js";

function createLeaderboardPanel(callbacks = {}, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  const localStore = options.localStore || null;
  let root = null;
  let body = null;
  let emptyElement = null;
  let currentResultElement = null;

  function catLabel(catId) {
    return CAT_DEFINITIONS[catId]?.label || catId || "-";
  }

  function dateText(value) {
    const date = new Date(Number(value));
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString("ko-KR") : "-";
  }

  function accuracyText(value) {
    const number = Number(value);
    const accuracy = Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
    return Math.round(accuracy * 100) + "%";
  }

  function multiplierText(value, accuracy) {
    const number = Number(value);
    const normalizedAccuracy = Number(accuracy);
    const multiplier = Number.isFinite(number)
      ? number
      : 0.5 + (Number.isFinite(normalizedAccuracy)
        ? Math.min(1, Math.max(0, normalizedAccuracy))
        : 0);
    return "x" + multiplier.toFixed(2);
  }

  function appendCell(row, value) {
    const cell = documentRef.createElement("td");
    cell.textContent = String(value ?? "");
    row.append(cell);
  }

  function renderRows(entries) {
    body?.replaceChildren?.();
    for (const [index, entry] of entries.entries()) {
      const row = documentRef.createElement("tr");
      row.dataset.catId = entry.catId || "black";
      appendCell(row, index + 1);
      appendCell(row, catLabel(entry.catId));
      appendCell(row, entry.score);
      appendCell(row, Number(entry.distanceM || 0).toLocaleString("ko-KR") + "m");
      appendCell(row, accuracyText(entry.rhythmAccuracy));
      appendCell(row, multiplierText(entry.rhythmMultiplier, entry.rhythmAccuracy));
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
      "· 정확도 " + accuracyText(result.rhythmAccuracy),
      "· 정확도 보정 " + multiplierText(result.rhythmMultiplier, result.rhythmAccuracy),
    ].join(" ");
    currentResultElement.append(heading, summary);
  }

  function load() {
    renderRows((localStore?.getLocalScores?.() || []).slice(0, 5));
    renderCurrentResult(options.currentResult || localStore?.getLastResult?.() || null);
    return true;
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
    heading.textContent = "내 기록";
    const intro = documentRef.createElement("p");
    intro.textContent = "내 기록 상위 5개";
    const table = documentRef.createElement("table");
    table.className = "leaderboard-table";
    const head = documentRef.createElement("thead");
    const headerRow = documentRef.createElement("tr");
    for (const label of ["순위", "고양이", "점수", "거리", "정확도", "정확도 보정", "달성일"]) {
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
    section.append(heading, intro, table, emptyElement, currentResultElement, actions);
    root.append(section);
    fitSingleLineText(heading, { container: section });
    load();
    return section;
  }

  return { mount, load };
}

export { createLeaderboardPanel };
