import { fitSingleLineText } from "./text-fitting.js";

function clearRoot(root) {
  root?.replaceChildren?.();
  if (root) {
    root.hidden = false;
  }
}

function appendText(documentRef, root, tagName, text, className = "") {
  const element = documentRef.createElement(tagName);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  root.append(element);
  return element;
}

function renderWelcomeScreen(root, options = {}) {
  const documentRef = options.documentRef || root?.ownerDocument || globalThis.document;
  if (!root || !documentRef?.createElement) {
    return null;
  }
  clearRoot(root);
  const section = documentRef.createElement("section");
  section.className = "welcome-screen flow-card";
  appendText(documentRef, section, "p", "썬더런", "eyebrow");
  const heading = appendText(documentRef, section, "h1", "집 밖으로, 고양이 출동! ", "fit-title");
  appendText(
    documentRef,
    section,
    "p",
    "쥐 인형을 모으고 장애물을 피해 가장 멀리 달려보세요.",
  );
  const startButton = documentRef.createElement("button");
  startButton.type = "button";
  startButton.className = "game-button primary";
  startButton.textContent = "게임 시작";
  startButton.addEventListener("click", () => options.onLocalPlay?.());
  section.append(startButton);
  root.append(section);
  fitSingleLineText(heading, { container: section });
  return section;
}

function renderLoadingScreen(root, options = {}) {
  const documentRef = options.documentRef || root?.ownerDocument || globalThis.document;
  if (!root || !documentRef?.createElement) {
    return null;
  }
  clearRoot(root);
  const section = documentRef.createElement("section");
  section.className = "flow-card loading-card";
  const heading = appendText(documentRef, section, "h1", "썬더런 불러오는 중...", "fit-title");
  root.append(section);
  fitSingleLineText(heading, { container: section });
  return section;
}

export { renderWelcomeScreen, renderLoadingScreen };
