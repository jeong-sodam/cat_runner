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
  appendText(documentRef, section, "p", "고양이 러너", "eyebrow");
  const heading = appendText(documentRef, section, "h1", "집 밖으로, 고양이 출동! ", "fit-title");
  appendText(
    documentRef,
    section,
    "p",
    "쥐 인형을 모으고 장애물을 피해 가장 멀리 달려보세요.",
  );
  const localPlay = documentRef.createElement("button");
  localPlay.type = "button";
  localPlay.className = "game-button primary";
  localPlay.textContent = "로컬로 플레이";
  localPlay.addEventListener("click", () => options.onLocalPlay?.());
  section.append(localPlay);
  appendText(
    documentRef,
    section,
    "small",
    "로컬 플레이는 로그인 없이 브라우저에 기록을 저장합니다.",
  );
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
  const heading = appendText(documentRef, section, "h1", "고양이 러너 불러오는 중...", "fit-title");
  root.append(section);
  fitSingleLineText(heading, { container: section });
  return section;
}

export { renderWelcomeScreen, renderLoadingScreen };
