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
    heading.textContent = "Run complete";
    const stats = documentRef.createElement("dl");
    stats.className = "result-stats";
    addStat(documentRef, stats, "Score", numberText(result.score));
    addStat(documentRef, stats, "Distance", numberText(result.distanceM, 1) + " m");
    addStat(documentRef, stats, "Mouse toys", numberText(result.mouseCount));

    const status = documentRef.createElement("p");
    status.className = result.saved === false ? "result-status unsaved" : "result-status";
    if (result.saved === false) {
      status.textContent = result.errorMessage || "The result is saved locally. Retry to submit it.";
    } else if (result.isPersonalBest) {
      status.textContent = "Personal best!";
    } else {
      status.textContent = "Run recorded.";
    }
    section.append(heading, stats, status);

    if (result.saved !== false && result.rank !== null && result.rank !== undefined) {
      const rank = documentRef.createElement("p");
      rank.className = "result-rank";
      rank.textContent = "Leaderboard rank: " + numberText(result.rank);
      section.append(rank);
    }

    const actions = documentRef.createElement("div");
    actions.className = "result-actions";
    if (result.saved === false && callbacks.onRetry) {
      const retryButton = documentRef.createElement("button");
      retryButton.type = "button";
      retryButton.className = "game-button primary";
      retryButton.textContent = "Retry save";
      retryButton.addEventListener("click", () => callbacks.onRetry());
      actions.append(retryButton);
    }
    const restartButton = documentRef.createElement("button");
    restartButton.type = "button";
    restartButton.className = "game-button";
    restartButton.textContent = "Choose cat";
    restartButton.addEventListener("click", () => callbacks.onRestart?.());
    const leaderboardButton = documentRef.createElement("button");
    leaderboardButton.type = "button";
    leaderboardButton.className = "game-button primary";
    leaderboardButton.textContent = "Leaderboard";
    leaderboardButton.addEventListener("click", () => callbacks.onLeaderboard?.());
    actions.append(restartButton, leaderboardButton);
    section.append(actions);
    root.append(section);
    return section;
  }

  return { mount };
}

export { createResultScreen };
