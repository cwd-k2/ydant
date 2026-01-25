/**
 * ナビゲーション API
 */

import type { RouteInfo } from "./types";
import { currentRoute, updateRoute } from "./state";

/**
 * 現在のルート情報を取得
 */
export function useRoute(): RouteInfo {
  return currentRoute;
}

/**
 * プログラムによるナビゲーション
 *
 * @param path - 遷移先のパス
 * @param replace - true の場合、履歴に追加せずに置き換え
 */
export function navigate(path: string, replace = false): void {
  if (replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  updateRoute(path);
}

/**
 * 履歴を戻る
 */
export function goBack(): void {
  window.history.back();
}

/**
 * 履歴を進む
 */
export function goForward(): void {
  window.history.forward();
}
