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

function renderAuthScreen(root, options = {}) {
  const documentRef = options.documentRef || root?.ownerDocument || globalThis.document;
  if (!root || !documentRef?.createElement) {
    return null;
  }
  clearRoot(root);
  const section = documentRef.createElement("section");
  section.className = "auth-screen flow-card";
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
  localPlay.className = "game-button primary auth-link";
  localPlay.textContent = "로컬로 플레이";
  localPlay.addEventListener("click", () => options.onLocalPlay?.());
  section.append(localPlay);
  const signIn = documentRef.createElement("button");
  signIn.type = "button";
  signIn.className = "game-button auth-link";
  signIn.textContent = "로그인 (개발 예정)";
  signIn.addEventListener("click", () => options.onLoginNotice?.());
  section.append(signIn);
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

function renderAuthConfigError(root, options = {}) {
  const documentRef = options.documentRef || root?.ownerDocument || globalThis.document;
  if (!root || !documentRef?.createElement) {
    return null;
  }
  clearRoot(root);
  const section = documentRef.createElement("section");
  section.className = "auth-screen flow-card error-card";
  section.dataset.state = "auth-config-error";
  appendText(documentRef, section, "p", "로그인 설정 필요", "eyebrow");
  const heading = appendText(documentRef, section, "h1", "Microsoft Entra ID를 준비해주세요.", "fit-title");
  appendText(
    documentRef,
    section,
    "p",
    "서버의 Entra ID 환경 변수가 아직 설정되지 않았습니다.",
  );
  appendText(
    documentRef,
    section,
    "small",
    "ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_TENANT_AUTHORITY, ENTRA_REDIRECT_URI를 확인하세요.",
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

export { renderAuthConfigError, renderAuthScreen, renderLoadingScreen };
