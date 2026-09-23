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

    const localResult = result.localOnly === true;
    const section = documentRef.createElement("section");
    section.className = "flow-card result-screen";
    const heading = documentRef.createElement("h1");
    if (localResult) {
      const badge = documentRef.createElement("span");
      badge.className = "local-mode-badge";
      badge.textContent = result.saved === false
        ? "로컬 플레이 · 저장 실패"
        : result.storageWarning === true
          ? "로컬 플레이 · 세션 기록"
          : "로컬 플레이 · 개인기록표 저장";
      section.append(badge);
    }
    heading.textContent = "달리기 완료";
    const stats = documentRef.createElement("dl");
    stats.className = "result-stats";
    addStat(documentRef, stats, "점수", numberText(result.score));
    addStat(documentRef, stats, "거리", numberText(result.distanceM, 1) + "m");
    addStat(documentRef, stats, "쥐 인형", numberText(result.mouseCount));

    const status = documentRef.createElement("p");
    status.className = result.saved === false
      ? "result-status unsaved"
      : result.storageWarning === true
        ? "result-status storage-warning"
        : "result-status";
    if (localResult && result.saved === false) {
      status.textContent = result.errorMessage || "개인기록표에 저장하지 못했습니다. 브라우저 저장소를 확인해주세요.";
    } else if (localResult && result.storageWarning === true) {
      status.textContent = "현재 세션에 기록되었습니다. 새로고침하거나 브라우저를 닫으면 기록이 사라질 수 있습니다.";
    } else if (localResult) {
      status.textContent = result.isPersonalBest
        ? "개인 최고 기록! 개인기록표에 저장되었습니다."
        : "개인기록표에 저장되었습니다.";
    } else if (result.saved === false) {
      status.textContent = result.errorMessage || "기록을 저장하지 못했습니다. 다시 저장해주세요.";
    } else if (result.isPersonalBest) {
      status.textContent = "개인 최고 기록!";
    } else {
      status.textContent = "기록이 저장되었습니다.";
    }
    section.append(heading, stats, status);

    const hasRank = result.rank !== null &&
      result.rank !== undefined &&
      Number.isFinite(Number(result.rank));
    if (result.saved !== false && hasRank) {
      const rank = documentRef.createElement("p");
      rank.className = "result-rank";
      rank.textContent = (localResult ? "개인 순위: " : "순위표 순위: ") + numberText(result.rank) + "위";
      section.append(rank);
    }

    const actions = documentRef.createElement("div");
    actions.className = "result-actions";
    if (result.saved === false && !localResult && callbacks.onRetry) {
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
    actions.append(restartButton);

    if (localResult && callbacks.onPersonalRecords) {
      const personalRecordsButton = documentRef.createElement("button");
      personalRecordsButton.type = "button";
      personalRecordsButton.className = "game-button primary";
      personalRecordsButton.textContent = "개인기록표";
      personalRecordsButton.addEventListener("click", () => callbacks.onPersonalRecords?.());
      actions.append(personalRecordsButton);
    }

    const leaderboardButton = documentRef.createElement("button");
    leaderboardButton.type = "button";
    leaderboardButton.className = localResult ? "game-button server-leaderboard-button" : "game-button primary";
    leaderboardButton.textContent = "순위표";
    if (localResult) {
      leaderboardButton.setAttribute("aria-disabled", "true");
    }
    leaderboardButton.addEventListener("click", () => callbacks.onLeaderboard?.());
    actions.append(leaderboardButton);
    section.append(actions);
    root.append(section);
    return section;
  }

  return { mount };
}

export { createResultScreen };
