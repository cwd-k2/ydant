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

import { scope } from "@ydant/core";
import { createBasePlugin, createDOMBackend } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";
import { App } from "./App";

scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createReactivePlugin(),
  createContextPlugin(),
]).mount(App);
