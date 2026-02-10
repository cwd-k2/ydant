import { mount } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import { App } from "./App";

mount(App, document.getElementById("app")!, {
  plugins: [createBasePlugin()],
});
