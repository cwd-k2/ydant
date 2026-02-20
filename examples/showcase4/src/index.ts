import { mount } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";
import { App } from "./App";

mount("#app", App, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
