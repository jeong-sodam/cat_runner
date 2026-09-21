const PENDING_RESULT_KEY = "cat-runner.pending-result";

const ERROR_MESSAGES = Object.freeze({
  AUTH_REQUIRED: "로그인이 필요합니다.",
  BAD_JSON: "요청 형식이 올바르지 않습니다.",
  NICKNAME_TOO_LONG: "닉네임은 80자 이하로 입력해 주세요.",
  NETWORK_ERROR: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  PAYLOAD_TOO_LARGE: "요청 데이터가 너무 큽니다.",
  SCORE_EVENT_INVALID: "게임 기록을 확인하지 못했습니다. 다시 시도해 주세요.",
});

function storageOrNull(storage) {
  if (storage) {
    return storage;
  }
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function savePendingResult(result, storage) {
  const target = storageOrNull(storage);
  if (!target || !result) {
    return false;
  }
  try {
    target.setItem(PENDING_RESULT_KEY, JSON.stringify(result));
    return true;
  } catch {
    return false;
  }
}

function loadPendingResult(storage) {
  const target = storageOrNull(storage);
  if (!target) {
    return null;
  }
  try {
    const value = target.getItem(PENDING_RESULT_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function clearPendingResult(storage) {
  const target = storageOrNull(storage);
  try {
    target?.removeItem(PENDING_RESULT_KEY);
  } catch {
    // Storage may be unavailable or read-only.
  }
}

function mapApiError(error = {}) {
  const code = error.code || (error.status ? "HTTP_ERROR" : "NETWORK_ERROR");
  const status = Number.isInteger(error.status) ? error.status : null;
  const retryable =
    typeof error.retryable === "boolean"
      ? error.retryable
      : !status || status >= 500 || status === 408 || status === 429;
  return {
    code,
    status,
    message: ERROR_MESSAGES[code] || error.message || "요청을 처리하지 못했습니다.",
    retryable,
  };
}

function makeMappedError(error) {
  const mapped = mapApiError(error);
  const next = new Error(mapped.message);
  Object.assign(next, mapped);
  next.cause = error;
  return next;
}

async function requestJson(fetchFnOrUrl, urlOrOptions, maybeOptions) {
  const fetchFn =
    typeof fetchFnOrUrl === "function" ? fetchFnOrUrl : globalThis.fetch;
  const url = typeof fetchFnOrUrl === "function" ? urlOrOptions : fetchFnOrUrl;
  const options =
    typeof fetchFnOrUrl === "function" ? maybeOptions || {} : urlOrOptions || {};
  const {
    pendingResult,
    onUnauthorized,
    storage,
    ...requestOptions
  } = options;
  let response;
  try {
    response = await fetchFn(url, {
      credentials: "same-origin",
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...(requestOptions.headers || {}),
      },
    });
  } catch (error) {
    throw makeMappedError({ ...error, code: "NETWORK_ERROR" });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const mapped = makeMappedError({
      ...(payload?.error || {}),
      status: response.status,
    });
    if (response.status === 401) {
      savePendingResult(pendingResult, storage);
      onUnauthorized?.(mapped);
    }
    throw mapped;
  }
  return payload;
}

function createApiClient(fetchFn = globalThis.fetch, options = {}) {
  return {
    request: (url, requestOptions = {}) =>
      requestJson(fetchFn, url, { ...options, ...requestOptions }),
    get: (url, requestOptions = {}) =>
      requestJson(fetchFn, url, { ...options, ...requestOptions }),
    post: (url, body, requestOptions = {}) =>
      requestJson(fetchFn, url, {
        ...options,
        ...requestOptions,
        method: "POST",
        body: JSON.stringify(body),
      }),
  };
}

export {
  ERROR_MESSAGES,
  PENDING_RESULT_KEY,
  clearPendingResult,
  createApiClient,
  loadPendingResult,
  mapApiError,
  requestJson,
  savePendingResult,
};
