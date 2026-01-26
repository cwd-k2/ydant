import { mount } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    mount(App, appRoot, { plugins: [createBasePlugin()] });
  }
});
