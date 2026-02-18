/**
 * Showcase 5 - Sortable List with keyed()
 *
 * keyed() ラッパーを使用した効率的なリスト更新のデモ
 *
 * keyed() の利点:
 * - DOM ノードの再利用によるパフォーマンス向上
 * - input のフォーカスやスクロール位置の保持
 * - アニメーションの継続
 */

import { scope } from "@ydant/core";
import { createBasePlugin, createDOMBackend } from "@ydant/base";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    scope(createDOMBackend(appRoot), [createBasePlugin()]).mount(App);
  }
});
