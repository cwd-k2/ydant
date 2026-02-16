import { mount } from "@ydant/core";
import { createBasePlugin, createDOMBackend } from "@ydant/base";
import { App } from "./App";

mount(App, {
  backend: createDOMBackend(document.getElementById("app")!),
  plugins: [createBasePlugin()],
});
