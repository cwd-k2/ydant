/**
 * Showcase 7 - CSS Transitions
 *
 * @ydant/transition パッケージの使用例:
 * - Transition: 単一要素の表示/非表示トランジション
 * - 入場アニメーション (enter, enterFrom, enterTo)
 * - 退場アニメーション (leave, leaveFrom, leaveTo)
 */

import { mount } from "@ydant/dom";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    mount(App, appRoot);
  }
});
