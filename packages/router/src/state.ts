/**
 * ルート状態管理
 *
 * NOTE: これらはモジュールレベルのグローバル状態。
 * 複数の Router インスタンスを同時に使用する場合は状態が共有される。
 * テスト間での分離には __resetForTesting__() を使用。
 */

import type { RouteInfo } from "./types";
import { parseQuery } from "./matching";

/** 初期ルート情報を取得 */
function getInitialRoute(): RouteInfo {
  return {
    path: typeof window !== "undefined" ? window.location.pathname : "/",
    params: {},
    query: parseQuery(typeof window !== "undefined" ? window.location.search : ""),
    hash: typeof window !== "undefined" ? window.location.hash : "",
  };
}

/** 現在のルート情報 */
export let currentRoute: RouteInfo = getInitialRoute();

/** ルート変更リスナー */
export const routeListeners: Set<() => void> = new Set();

/**
 * テスト用: 状態をリセット
 * @internal
 */
export function __resetForTesting__(): void {
  currentRoute = getInitialRoute();
  routeListeners.clear();
}

/** ルート情報を更新 */
export function updateRoute(path: string): void {
  const url = new URL(path, window.location.origin);
  currentRoute = {
    path: url.pathname,
    params: {},
    query: parseQuery(url.search),
    hash: url.hash,
  };

  // リスナーに通知
  for (const listener of routeListeners) {
    listener();
  }
}
