import { scope } from "@ydant/core";
import { createBasePlugin, createDOMBackend } from "@ydant/base";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    scope(createDOMBackend(appRoot), [createBasePlugin()]).mount(App);
  }
});
