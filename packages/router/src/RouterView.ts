/**
 * RouterView コンポーネント
 *
 * 現在のパスに基づいて適切なコンポーネントを表示する。
 * ルート定義と現在の URL を照合し、マッチしたコンポーネントをレンダリングする。
 *
 * @example
 * ```typescript
 * yield* RouterView({
 *   routes: [
 *     { path: "/", component: Home },
 *     { path: "/about", component: About },
 *     { path: "/users/:id", component: UserDetail },
 *     { path: "*", component: NotFound },
 *   ],
 *   base: "/app",  // オプション: ベースパス
 * });
 * ```
 */

import type { Render } from "@ydant/core";
import { div, onMount } from "@ydant/base";
import type { RouteDefinition, RouterViewProps } from "./types";
import { currentRoute, routeListeners, updateRoute } from "./state";
import { matchPath } from "./matching";

/**
 * マッチするルートを検索し、ガードの結果とコンポーネントを返す
 */
function findMatchedRoute(
  routes: RouteDefinition[],
  base: string,
): { route: RouteDefinition; params: Record<string, string> } | null {
  const path = currentRoute.path.startsWith(base)
    ? currentRoute.path.slice(base.length) || "/"
    : currentRoute.path;

  for (const route of routes) {
    const { match, params } = matchPath(path, route.path);
    if (match) {
      return { route, params };
    }
  }

  return null;
}

/**
 * 同期的にルートをレンダリング（guard が同期の場合）
 */
function renderMatchedRouteSync(routes: RouteDefinition[], base: string): Render[] {
  const matched = findMatchedRoute(routes, base);
  if (!matched) return [];

  const { route, params } = matched;
  currentRoute.params = params;

  // guard がない場合はコンポーネントを返す
  if (!route.guard) {
    return [route.component()];
  }

  const allowed = route.guard();
  if (allowed instanceof Promise) {
    // async guard の場合は空を返す（後で refresh される）
    return [];
  }

  return allowed ? [route.component()] : [];
}

/**
 * 非同期ガードを処理し、必要に応じて refresh を呼ぶ
 */
async function handleAsyncGuard(
  routes: RouteDefinition[],
  base: string,
  refresh: (builder: () => Render[]) => void,
): Promise<void> {
  const matched = findMatchedRoute(routes, base);
  if (!matched) return;

  const { route, params } = matched;

  if (route.guard) {
    const allowed = route.guard();
    if (allowed instanceof Promise) {
      const result = await allowed;
      if (result) {
        currentRoute.params = params;
        refresh(() => [route.component()]);
      }
      // false の場合は refresh しない（空のまま）
    }
  }
}

/**
 * RouterView コンポーネント
 *
 * 現在のパスに基づいて適切なコンポーネントを表示する。
 * History API の popstate イベントを監視し、URL 変更時に再レンダリングする。
 *
 * @param props - RouterView のプロパティ
 * @param props.routes - ルート定義の配列
 * @param props.base - ベースパス（オプション、デフォルト: ""）
 * @returns コンテナ要素の Render
 */
export function RouterView(props: RouterViewProps): Render {
  const { routes, base = "" } = props;

  return div(function* () {
    // コンテナの子要素として内部コンテナを作成
    const innerSlot = yield* div(() => renderMatchedRouteSync(routes, base));

    // 初回の async guard を処理
    handleAsyncGuard(routes, base, (builder) => innerSlot.refresh(builder));

    // popstate イベントのリスナーを登録
    yield* onMount(() => {
      const handlePopState = () => {
        updateRoute(window.location.pathname);
        innerSlot.refresh(() => renderMatchedRouteSync(routes, base));
        handleAsyncGuard(routes, base, (builder) => innerSlot.refresh(builder));
      };

      window.addEventListener("popstate", handlePopState);

      // ルート変更リスナーを登録
      const routeChangeListener = () => {
        innerSlot.refresh(() => renderMatchedRouteSync(routes, base));
        handleAsyncGuard(routes, base, (builder) => innerSlot.refresh(builder));
      };
      routeListeners.add(routeChangeListener);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        routeListeners.delete(routeChangeListener);
      };
    });
  });
}
