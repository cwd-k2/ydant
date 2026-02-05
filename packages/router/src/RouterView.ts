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
 * マッチするルートをレンダリング（配列を返す）
 */
function renderMatchedRouteArray(routes: RouteDefinition[], base: string): Render[] {
  const path = currentRoute.path.startsWith(base)
    ? currentRoute.path.slice(base.length) || "/"
    : currentRoute.path;

  for (const route of routes) {
    const { match, params } = matchPath(path, route.path);

    if (match) {
      // パラメータを更新
      currentRoute.params = params;

      // ルートガードを実行
      if (route.guard) {
        const allowed = route.guard();
        if (allowed instanceof Promise) {
          // 非同期ガードはサポート外（将来の拡張）
          console.warn("Async route guards are not yet supported");
        } else if (!allowed) {
          return [];
        }
      }

      // コンポーネントを返す
      return [route.component()];
    }
  }

  // マッチするルートがない場合は空配列
  return [];
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
    const innerSlot = yield* div(() => renderMatchedRouteArray(routes, base));

    // popstate イベントのリスナーを登録
    yield* onMount(() => {
      const handlePopState = () => {
        updateRoute(window.location.pathname);
        innerSlot.refresh(() => renderMatchedRouteArray(routes, base));
      };

      window.addEventListener("popstate", handlePopState);

      // ルート変更リスナーを登録
      const routeChangeListener = () => {
        innerSlot.refresh(() => renderMatchedRouteArray(routes, base));
      };
      routeListeners.add(routeChangeListener);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        routeListeners.delete(routeChangeListener);
      };
    });
  });
}
