import { mount } from "@ydant/core";
import { createBasePlugin, createDOMCapabilities } from "@ydant/base";
import { App } from "./App";

mount(App, {
  root: document.getElementById("app")!,
  plugins: [createDOMCapabilities(), createBasePlugin()],
});
