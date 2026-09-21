import { mapApiError } from "../app/api-client.js";

function createErrorBanner(options = {}) {
  const documentRef = options.documentRef || globalThis.document;
  let root = null;
  let messageElement = null;
  let retryButton = null;

  function mount(nextRoot) {
    root = nextRoot;
    if (!root || !documentRef?.createElement) {
      return null;
    }
    const banner = documentRef.createElement("section");
    banner.className = "error-banner";
    banner.hidden = true;
    messageElement = documentRef.createElement("p");
    retryButton = documentRef.createElement("button");
    retryButton.type = "button";
    retryButton.className = "game-button primary";
    retryButton.textContent = "다시 시도";
    retryButton.hidden = true;
    banner.append(messageElement, retryButton);
    root.append(banner);
    return banner;
  }

  function hide() {
    if (messageElement?.parentNode) {
      messageElement.parentNode.hidden = true;
    }
  }

  function showError(error, onRetry) {
    if (!messageElement) {
      return;
    }
    const mapped = mapApiError(error);
    messageElement.textContent = mapped.message;
    messageElement.parentNode.hidden = false;
    retryButton.hidden = !mapped.retryable || typeof onRetry !== "function";
    retryButton.replaceChildren?.();
    retryButton.addEventListener("click", () => onRetry?.());
  }

  return { mount, showError, showRetry: showError, hide };
}

function showError(root, error, options = {}) {
  const banner = createErrorBanner(options);
  banner.mount(root);
  banner.showError(error, options.onRetry);
  return banner;
}

function showRetry(root, onRetry, options = {}) {
  return showError(root, { code: "NETWORK_ERROR" }, { ...options, onRetry });
}

export { createErrorBanner, showError, showRetry };
