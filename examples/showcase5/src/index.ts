/**
 * Showcase 5 - Sortable List with key()
 *
 * key() プリミティブを使用した効率的なリスト更新のデモ
 *
 * key() の利点:
 * - DOM ノードの再利用によるパフォーマンス向上
 * - input のフォーカスやスクロール位置の保持
 * - アニメーションの継続
 */

import { mount } from "@ydant/dom";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    mount(App, appRoot);
  }
});
