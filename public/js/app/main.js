import { createAppController } from "./app-controller.js";

function bootstrapApp(options = {}) {
  const controller = createAppController(options);
  void controller.bootstrap();
  return controller;
}

if (globalThis.document) {
  bootstrapApp();
}

export { bootstrapApp };
