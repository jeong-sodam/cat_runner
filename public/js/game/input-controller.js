function createInputController(canvas, onPause) {
  const target = canvas?.ownerDocument?.defaultView || globalThis;
  let jumpPressed = false;
  let slideHeld = false;

  function normalizeKey(event) {
    return typeof event.key === "string" ? event.key.toLowerCase() : "";
  }

  function onKeyDown(event) {
    const key = normalizeKey(event);
    if (!["w", "s", "p"].includes(key)) {
      return;
    }
    event.preventDefault?.();
    if (key === "w") {
      if (!event.repeat) {
        jumpPressed = true;
      }
    } else if (key === "s") {
      slideHeld = true;
    } else if (key === "p" && !event.repeat) {
      onPause?.();
    }
  }

  function onKeyUp(event) {
    const key = normalizeKey(event);
    if (key !== "s") {
      return;
    }
    event.preventDefault?.();
    slideHeld = false;
  }

  target.addEventListener?.("keydown", onKeyDown);
  target.addEventListener?.("keyup", onKeyUp);

  return {
    consumeJumpPress() {
      const pressed = jumpPressed;
      jumpPressed = false;
      return pressed;
    },
    isSliding() {
      return slideHeld;
    },
    destroy() {
      target.removeEventListener?.("keydown", onKeyDown);
      target.removeEventListener?.("keyup", onKeyUp);
    },
  };
}

export { createInputController };
