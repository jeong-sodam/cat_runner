function apiError(code, message, status = 500, options = {}) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  if (options.reason) {
    error.reason = options.reason;
  }
  if (typeof options.retryable === "boolean") {
    error.retryable = options.retryable;
  }
  return error;
}

function isRetryableStatus(status) {
  return status >= 500 || status === 408 || status === 429;
}

function errorPayload(code, message, status = 500, options = {}) {
  return {
    error: {
      code,
      message,
      retryable:
        typeof options.retryable === "boolean"
          ? options.retryable
          : isRetryableStatus(status),
    },
  };
}

function sendApiError(response, status, code, message, options = {}) {
  return response.status(status).json(errorPayload(code, message, status, options));
}

function normalizeError(error) {
  if (error?.type === "entity.parse.failed") {
    return apiError("BAD_JSON", "Request body must be valid JSON.", 400, {
      retryable: false,
    });
  }
  if (error?.type === "entity.too.large") {
    return apiError("PAYLOAD_TOO_LARGE", "Request body is too large.", 413, {
      retryable: false,
    });
  }
  return error || apiError("INTERNAL_ERROR", "Internal server error.");
}

function notFoundHandler(request, _response, next) {
  if (request.path === "/api" || request.path.startsWith("/api/")) {
    return next(apiError("NOT_FOUND", "API endpoint not found.", 404));
  }
  return next(apiError("NOT_FOUND", "Page not found.", 404));
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }
  const normalized = normalizeError(error);
  const status = Number.isInteger(normalized.status) ? normalized.status : 500;
  const code = normalized.code || "INTERNAL_ERROR";
  const message = status >= 500 ? "Internal server error." : normalized.message;
  const payload = errorPayload(code, message, status, normalized);
  if (normalized.reason && status < 500) {
    payload.error.reason = normalized.reason;
  }
  return response.status(status).json(payload);
}

module.exports = {
  apiError,
  errorHandler,
  errorPayload,
  isRetryableStatus,
  notFoundHandler,
  normalizeError,
  sendApiError,
};
