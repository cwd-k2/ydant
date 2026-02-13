import { mount } from "@ydant/core";
import { createBasePlugin, createDOMCapabilities } from "@ydant/base";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    mount(App, { root: appRoot, plugins: [createDOMCapabilities(), createBasePlugin()] });
  }
});
