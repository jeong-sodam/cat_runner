function createRunApiClient(fetchFn = globalThis.fetch) {
  async function request(url, options = {}) {
    let response;
    try {
      response = await fetchFn(url, {
        credentials: "same-origin",
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
    } catch {
      const error = new Error("The run server could not be reached.");
      error.code = "NETWORK_ERROR";
      error.status = null;
      throw error;
    }
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) {
      const error = new Error(payload.error?.message || "Run request failed.");
      error.code = payload.error?.code || "RUN_REQUEST_FAILED";
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  return {
    startRun: ({ catId }) =>
      request("/api/runs", {
        method: "POST",
        body: JSON.stringify({ catId }),
      }),
    appendEvents: (runId, events) =>
      request("/api/runs/" + encodeURIComponent(runId) + "/events", {
        method: "POST",
        body: JSON.stringify({ events }),
      }),
    saveSnapshot: (runId, snapshotVersion, snapshot) =>
      request("/api/runs/" + encodeURIComponent(runId) + "/snapshot", {
        method: "PUT",
        body: JSON.stringify({ snapshotVersion, snapshot }),
      }),
    getResumableRun: () => request("/api/runs/resumable"),
    abandonRun: (runId) =>
      request("/api/runs/" + encodeURIComponent(runId) + "/abandon", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    completeRun: (runId, events = [], clientFinishedAt = Date.now()) =>
      request("/api/runs/" + encodeURIComponent(runId) + "/complete", {
        method: "POST",
        body: JSON.stringify({ events, clientFinishedAt }),
      }),
    getLeaderboard: () => request("/api/leaderboard"),
  };
}

export { createRunApiClient };
