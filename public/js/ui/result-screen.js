function numberText(value, fractionDigits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }
  return number.toLocaleString("ko-KR", {
    maximumFractionDigits: fractionDigits,
  });
}

function createResultScreen(result = {}, callbacks = {}, options = {}) {
  const documentRef = options.documentRef || globalThis.document;

  function addStat(documentNode, container, label, value) {
    const item = documentNode.createElement("div");
    item.className = "result-stat";
    const labelElement = documentNode.createElement("dt");
    labelElement.textContent = label;
    const valueElement = documentNode.createElement("dd");
    valueElement.textContent = value;
    item.append(labelElement, valueElement);
    container.append(item);
  }

  function mount(root) {
    if (!root || !documentRef?.createElement) {
      return null;
    }
    root.replaceChildren();
    root.hidden = false;

    const section = documentRef.createElement("section");
    section.className = "flow-card result-screen";
    const heading = documentRef.createElement("h1");
    if (result.localOnly) {
      const badge = documentRef.createElement("span");
      badge.className = "local-mode-badge";
      badge.textContent = "로컬 플레이 · 순위표 미등록";
      section.append(badge);
    }
    heading.textContent = "달리기 완료";
    const stats = documentRef.createElement("dl");
    stats.className = "result-stats";
    addStat(documentRef, stats, "점수", numberText(result.score));
    addStat(documentRef, stats, "거리", numberText(result.distanceM, 1) + "m");
    addStat(documentRef, stats, "쥐 인형", numberText(result.mouseCount));

    const status = documentRef.createElement("p");
    status.className = result.saved === false ? "result-status unsaved" : "result-status";
    if (result.localOnly) {
      status.textContent = result.errorMessage || "로컬 플레이 기록은 순위표에 등록되지 않습니다.";
    } else if (result.saved === false) {
      status.textContent = result.errorMessage || "기록을 기기에 저장했습니다. 다시 저장해주세요.";
    } else if (result.isPersonalBest) {
      status.textContent = "개인 최고 기록!";
    } else {
      status.textContent = "기록이 저장되었습니다.";
    }
    section.append(heading, stats, status);

    if (result.saved !== false && result.rank !== null && result.rank !== undefined) {
      const rank = documentRef.createElement("p");
      rank.className = "result-rank";
      rank.textContent = "순위표 순위: " + numberText(result.rank);
      section.append(rank);
    }

    const actions = documentRef.createElement("div");
    actions.className = "result-actions";
    if (result.saved === false && !result.localOnly && callbacks.onRetry) {
      const retryButton = documentRef.createElement("button");
      retryButton.type = "button";
      retryButton.className = "game-button primary";
      retryButton.textContent = "저장 재시도";
      retryButton.addEventListener("click", () => callbacks.onRetry());
      actions.append(retryButton);
    }
    const restartButton = documentRef.createElement("button");
    restartButton.type = "button";
    restartButton.className = "game-button";
    restartButton.textContent = "캐릭터 선택";
    restartButton.addEventListener("click", () => callbacks.onRestart?.());
    const leaderboardButton = documentRef.createElement("button");
    leaderboardButton.type = "button";
    leaderboardButton.className = "game-button primary";
    leaderboardButton.textContent = "순위표";
    leaderboardButton.addEventListener("click", () => callbacks.onLeaderboard?.());
    actions.append(restartButton, leaderboardButton);
    section.append(actions);
    root.append(section);
    return section;
  }

  return { mount };
}

export { createResultScreen };
