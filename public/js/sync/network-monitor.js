function createNetworkMonitor(onOffline = () => {}, onOnline = () => {}, targetOrOptions = {}) {
  const target = targetOrOptions.addEventListener
    ? targetOrOptions
    : targetOrOptions.windowRef || globalThis;
  let online = target.navigator?.onLine !== false;
  let started = false;

  function handleOffline(event) {
    online = false;
    onOffline(event);
  }

  function handleOnline(event) {
    online = true;
    onOnline(event);
  }

  function start() {
    if (started) {
      return;
    }
    started = true;
    target.addEventListener?.("offline", handleOffline);
    target.addEventListener?.("online", handleOnline);
  }

  function stop() {
    if (!started) {
      return;
    }
    started = false;
    target.removeEventListener?.("offline", handleOffline);
    target.removeEventListener?.("online", handleOnline);
  }

  start();
  return {
    start,
    stop,
    isOnline: () => online,
  };
}

export { createNetworkMonitor };
