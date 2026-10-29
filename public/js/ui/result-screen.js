import { fitSingleLineText } from "./text-fitting.js";

function numberText(value, fractionDigits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }
  return number.toLocaleString("ko-KR", {
    maximumFractionDigits: fractionDigits,
  });
}

function normalizedAccuracy(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
}

function accuracyText(value) {
  return Math.round(normalizedAccuracy(value) * 100) + "%";
}

function multiplierText(value, accuracy) {
  const number = Number(value);
  const multiplier = Number.isFinite(number)
    ? number
    : 0.5 + normalizedAccuracy(accuracy);
  return "x" + multiplier.toFixed(2);
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
    heading.className = "fit-title";
    heading.textContent = "달리기 완료";
    const stats = documentRef.createElement("dl");
    stats.className = "result-stats";
    addStat(documentRef, stats, "점수", numberText(result.score));
    addStat(documentRef, stats, "거리", numberText(result.distanceM, 1) + "m");
    addStat(documentRef, stats, "쥐 인형", numberText(result.mouseCount));
    addStat(documentRef, stats, "정확도", accuracyText(result.rhythmAccuracy));
    addStat(documentRef, stats, "정확도 보정", multiplierText(result.rhythmMultiplier, result.rhythmAccuracy));

    const status = documentRef.createElement("p");
    status.className = result.saved === false
      ? "result-status unsaved"
      : result.storageWarning === true
        ? "result-status storage-warning"
        : "result-status";
    if (result.saved === false) {
      status.textContent = result.errorMessage || "내 기록에 저장하지 못했습니다. 브라우저 저장소를 확인해주세요.";
    } else if (result.storageWarning === true) {
      status.textContent = "현재 세션에 기록되었습니다. 새로고침하거나 브라우저를 닫으면 기록이 사라질 수 있습니다.";
    } else {
      status.textContent = result.isPersonalBest
        ? "개인 최고 기록! 내 기록에 저장되었습니다."
        : "내 기록에 저장되었습니다.";
    }
    section.append(heading, stats, status);

    const hasRank = result.rank !== null &&
      result.rank !== undefined &&
      Number.isFinite(Number(result.rank));
    if (result.saved !== false && hasRank) {
      const rank = documentRef.createElement("p");
      rank.className = "result-rank";
      rank.textContent = "개인 순위: " + numberText(result.rank) + "위";
      section.append(rank);
    }

    const actions = documentRef.createElement("div");
    actions.className = "result-actions";
    const restartButton = documentRef.createElement("button");
    restartButton.type = "button";
    restartButton.className = "game-button";
    restartButton.textContent = "캐릭터 선택";
    restartButton.addEventListener("click", () => callbacks.onRestart?.());
    actions.append(restartButton);

    if (callbacks.onLeaderboard) {
      const localScoresButton = documentRef.createElement("button");
      localScoresButton.type = "button";
      localScoresButton.className = "game-button";
      localScoresButton.textContent = "내 기록";
      localScoresButton.addEventListener("click", () => callbacks.onLeaderboard());
      actions.append(localScoresButton);
    }

    section.append(actions);
    root.append(section);
    fitSingleLineText(heading, { container: section });
    return section;
  }

  return { mount };
}

export { createResultScreen };
