import { scope } from "@ydant/core";
import { createBasePlugin, createDOMBackend } from "@ydant/base";
import { App } from "./App";

scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()]).mount(App);
