/**
 * Router コンポーネント
 */

import type { Render } from "@ydant/core";
import { div, a, on, attr, onMount } from "@ydant/base";
import type { RouteDefinition, RouterViewProps, RouterLinkProps } from "./types";
import { currentRoute, routeListeners, updateRoute } from "./state";
import { matchPath } from "./matching";
import { navigate } from "./navigation";

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
 * RouterLink コンポーネント
 *
 * クリック時に navigate() を呼び出す <a> 要素を生成する。
 */
export function RouterLink(props: RouterLinkProps): Render {
  const { href, children, activeClass } = props;

  return a(function* () {
    yield* attr("href", href);

    // アクティブクラスの適用
    if (activeClass && currentRoute.path === href) {
      yield* attr("class", activeClass);
    }

    yield* on("click", (e: Event) => {
      e.preventDefault();
      navigate(href);
    });

    yield* children();
  });
}

/**
 * RouterView コンポーネント
 *
 * 現在のパスに基づいて適切なコンポーネントを表示する。
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
