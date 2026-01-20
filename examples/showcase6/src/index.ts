/**
 * Showcase 6 - Async Data Fetching
 *
 * @ydant/async パッケージの使用例:
 * - createResource: 非同期データフェッチング
 * - Suspense: ローディング中のフォールバック表示
 * - ErrorBoundary: エラーハンドリング
 */

import { mount } from "@ydant/dom";
import { App } from "./App";

window.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.getElementById("app");
  if (appRoot) {
    mount(App, appRoot);
  }
});
