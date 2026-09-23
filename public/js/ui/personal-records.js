function numberText(value, fractionDigits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }
  return number.toLocaleString("ko-KR", {
    maximumFractionDigits: fractionDigits,
  });
}

function accuracyText(value) {
  return numberText(value, 1) + "%";
}

function dateText(value) {
  const date = new Date(Number(value));
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("ko-KR")
    : "-";
}

function appendCell(documentRef, row, value) {
  const cell = documentRef.createElement("td");
  cell.textContent = String(value ?? "");
  row.append(cell);
}

function createPersonalRecordsPanel(callbacks = {}, options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  const localStore = options.localStore || null;
  let root = null;
  let body = null;
  let emptyElement = null;
  let latestElement = null;

  function latestResult() {
    return options.currentResult || localStore?.getLastResult?.() || null;
  }

  function latestRank(result) {
    const rawRank = result?.rank;
    const explicitRank = Number(rawRank);
    if (rawRank !== null && rawRank !== undefined && Number.isFinite(explicitRank)) {
      return explicitRank;
    }
    const calculatedRank = localStore?.getLocalRank?.(result);
    return Number.isFinite(Number(calculatedRank)) ? Number(calculatedRank) : "-";
  }

  function renderRows(entries) {
    body?.replaceChildren?.();
    for (const [index, entry] of entries.entries()) {
      const row = documentRef.createElement("tr");
      row.dataset.rank = String(index + 1);
      appendCell(documentRef, row, index + 1);
      appendCell(documentRef, row, numberText(entry.score));
      appendCell(documentRef, row, numberText(entry.distanceM, 1) + "m");
      appendCell(documentRef, row, accuracyText(entry.rhythmAccuracy));
      appendCell(documentRef, row, dateText(entry.achievedAt));
      body?.append(row);
    }
    if (emptyElement) {
      emptyElement.hidden = entries.length > 0;
    }
  }

  function renderLatest(result) {
    if (!latestElement) {
      return;
    }
    latestElement.replaceChildren?.();
    if (!result) {
      latestElement.hidden = true;
      return;
    }
    latestElement.hidden = false;
    const heading = documentRef.createElement("h2");
    heading.textContent = "방금 기록";
    const summary = documentRef.createElement("p");
    const rank = latestRank(result);
    summary.textContent = [
      "개인 순위 " + (rank === "-" ? "-" : String(rank) + "위"),
      "점수 " + numberText(result.score),
      "거리 " + numberText(result.distanceM, 1) + "m",
      "정확도 " + accuracyText(result.rhythmAccuracy),
      "플레이 날짜 " + dateText(result.achievedAt),
    ].join(" · ");
    latestElement.append(heading, summary);
  }

  function render() {
    const entries = (localStore?.getLocalScores?.() || []).slice(0, 5);
    renderRows(entries);
    renderLatest(latestResult());
  }

  function mount(nextRoot) {
    root = nextRoot;
    if (!root || !documentRef?.createElement) {
      return null;
    }
    root.replaceChildren();
    root.hidden = false;

    const section = documentRef.createElement("section");
    section.className = "flow-card wide-card personal-records-screen";
    const heading = documentRef.createElement("h1");
    heading.textContent = "개인기록표";
    const intro = documentRef.createElement("p");
    intro.textContent = "LOCAL 플레이 개인 최고 기록 5개";
    const storageWarning = documentRef.createElement("p");
    storageWarning.className = "local-storage-warning";
    storageWarning.textContent = "현재 세션에 저장된 기록입니다. 새로고침하거나 브라우저를 닫으면 기록이 사라질 수 있습니다.";
    storageWarning.hidden = !(
      options.currentResult?.storageWarning === true ||
      localStore?.getStorageStatus?.().warning === true
    );

    const table = documentRef.createElement("table");
    table.className = "leaderboard-table personal-records-table";
    const head = documentRef.createElement("thead");
    const headerRow = documentRef.createElement("tr");
    for (const label of ["순위", "점수", "거리", "정확도", "플레이 날짜"]) {
      const cell = documentRef.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      headerRow.append(cell);
    }
    head.append(headerRow);
    body = documentRef.createElement("tbody");
    table.append(head, body);

    emptyElement = documentRef.createElement("p");
    emptyElement.className = "leaderboard-empty personal-records-empty";
    emptyElement.textContent = "아직 저장된 개인 기록이 없습니다.";
    emptyElement.hidden = true;

    latestElement = documentRef.createElement("div");
    latestElement.className = "latest-local-result";
    latestElement.hidden = true;

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

    section.append(heading, intro, storageWarning, table, emptyElement, latestElement, actions);
    root.append(section);
    render();
    return section;
  }

  return { mount, render };
}

export { createPersonalRecordsPanel };
