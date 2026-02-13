/**
 * Showcase 4 - SPA Demo
 *
 * Router, Context, Reactive の使用例
 * Form バリデーションはユーザー実装例として示す
 *
 * プラグインアーキテクチャの使用例:
 * - createReactivePlugin() で reactive プリミティブを有効化
 * - createContextPlugin() で provide/inject を有効化
 */

import { mount } from "@ydant/core";
import { createBasePlugin, createDOMCapabilities } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";
import { App } from "./App";

mount(App, {
  root: document.getElementById("app")!,
  plugins: [
    createDOMCapabilities(),
    createBasePlugin(),
    createReactivePlugin(),
    createContextPlugin(),
  ],
});
