import { mount } from "@ydant/base";
import { createPortalPlugin } from "@ydant/portal";
import { App } from "./App";

mount("#app", App, {
  plugins: [createPortalPlugin()],
});
