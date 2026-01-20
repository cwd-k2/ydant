/**
 * Router
 *
 * SPA のルーティングを提供する。
 * History API を使用したクライアントサイドルーティング。
 *
 * @example
 * ```typescript
 * import { RouterView, RouterLink, useRoute } from "@ydant/router";
 *
 * const App: Component = () =>
 *   div(function* () {
 *     yield* nav(() => [
 *       RouterLink({ href: "/", children: () => text("Home") }),
 *       RouterLink({ href: "/about", children: () => text("About") }),
 *     ]);
 *
 *     yield* RouterView({
 *       routes: [
 *         { path: "/", component: Home },
 *         { path: "/about", component: About },
 *         { path: "/users/:id", component: UserDetail },
 *         { path: "*", component: NotFound },
 *       ],
 *     });
 *   });
 * ```
 */

import type { Render, Component } from "@ydant/core";
import { div, a, on, attr, onMount } from "@ydant/core";

/** ルート定義 */
export interface RouteDefinition {
  /** パスパターン（例: "/users/:id"） */
  path: string;
  /** パスにマッチした時に表示するコンポーネント */
  component: Component;
  /** ルートガード（false を返すとナビゲーションをキャンセル） */
  guard?: () => boolean | Promise<boolean>;
}

/** ルート情報 */
export interface RouteInfo {
  /** 現在のパス */
  path: string;
  /** パスパラメータ（例: { id: "123" }） */
  params: Record<string, string>;
  /** クエリパラメータ */
  query: Record<string, string>;
  /** ハッシュ */
  hash: string;
}

/** RouterView コンポーネントの props */
export interface RouterViewProps {
  /** ルート定義の配列 */
  routes: RouteDefinition[];
  /** ベースパス（オプション） */
  base?: string;
}

/** RouterLink コンポーネントの props */
export interface RouterLinkProps {
  /** リンク先のパス */
  href: string;
  /** リンクの子要素 */
  children: () => Render;
  /** アクティブ時に追加するクラス */
  activeClass?: string;
}

// =============================================================================
// Internal State
// =============================================================================

/** 現在のルート情報 */
let currentRoute: RouteInfo = {
  path: typeof window !== "undefined" ? window.location.pathname : "/",
  params: {},
  query: parseQuery(typeof window !== "undefined" ? window.location.search : ""),
  hash: typeof window !== "undefined" ? window.location.hash : "",
};

/** ルート変更リスナー */
const routeListeners: Set<() => void> = new Set();

/** パスパターンからパラメータ名を抽出 */
function extractParamNames(pattern: string): string[] {
  const matches = pattern.match(/:([^/]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/** パスパターンを正規表現に変換 */
function patternToRegex(pattern: string): RegExp {
  if (pattern === "*") {
    return /.*/;
  }
  // まず :param を一時的なプレースホルダーに置き換え
  // その後、正規表現の特殊文字をエスケープ
  // 最後にプレースホルダーをキャプチャグループに置換
  const placeholder = "___PARAM___";

  // パラメータをプレースホルダーに置換
  const withPlaceholders = pattern.replace(/:([^/]+)/g, placeholder);

  // 正規表現の特殊文字をエスケープ
  const escaped = withPlaceholders.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // プレースホルダーをキャプチャグループに置換
  const regexStr = escaped.replace(new RegExp(placeholder, "g"), "([^/]+)");

  return new RegExp(`^${regexStr}$`);
}

/** クエリ文字列をパース */
function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  if (search.startsWith("?")) {
    search = search.slice(1);
  }
  if (search) {
    for (const pair of search.split("&")) {
      const [key, value] = pair.split("=");
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    }
  }
  return query;
}

/** パスがパターンにマッチするか確認し、パラメータを抽出 */
function matchPath(
  path: string,
  pattern: string
): { match: boolean; params: Record<string, string> } {
  const regex = patternToRegex(pattern);
  const match = path.match(regex);

  if (!match) {
    return { match: false, params: {} };
  }

  const paramNames = extractParamNames(pattern);
  const params: Record<string, string> = {};

  for (let i = 0; i < paramNames.length; i++) {
    params[paramNames[i]] = match[i + 1] || "";
  }

  return { match: true, params };
}

/** ルート情報を更新 */
function updateRoute(path: string): void {
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

// =============================================================================
// Public API
// =============================================================================

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

/**
 * マッチするルートをレンダリング（配列を返す）
 */
function renderMatchedRouteArray(
  routes: RouteDefinition[],
  base: string
): Render[] {
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

// Legacy aliases for backwards compatibility
/** @deprecated Use RouterView instead */
export const Router = RouterView;
/** @deprecated Use RouterViewProps instead */
export type RouterProps = RouterViewProps;
/** @deprecated Use RouterLink instead */
export const Link = RouterLink;
/** @deprecated Use RouterLinkProps instead */
export type LinkProps = RouterLinkProps;
