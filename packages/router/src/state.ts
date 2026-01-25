/**
 * ルート状態管理
 */

import type { RouteInfo } from "./types";
import { parseQuery } from "./matching";

/** 現在のルート情報 */
export let currentRoute: RouteInfo = {
  path: typeof window !== "undefined" ? window.location.pathname : "/",
  params: {},
  query: parseQuery(
    typeof window !== "undefined" ? window.location.search : "",
  ),
  hash: typeof window !== "undefined" ? window.location.hash : "",
};

/** ルート変更リスナー */
export const routeListeners: Set<() => void> = new Set();

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
