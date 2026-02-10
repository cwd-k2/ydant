/**
 * Showcase 4 - SPA Demo
 *
 * Router, Context, Reactive の使用例
 * Form バリデーションはユーザー実装例として示す
 *
 * プラグインアーキテクチャの使用例:
 * - createReactivePlugin() で reactive プリミティブを有効化
 * - createContextPlugin() で provide/inject を有効化
 * - createRouterPlugin() で SPA ルーティングを有効化
 */

import { mount } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";
import { createRouterPlugin } from "@ydant/router";
import { App } from "./App";

mount(App, document.getElementById("app")!, {
  plugins: [
    createBasePlugin(),
    createReactivePlugin(),
    createContextPlugin(),
    createRouterPlugin(),
  ],
});
