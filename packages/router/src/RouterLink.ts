/**
 * RouterLink コンポーネント
 *
 * クリック時に navigate() を呼び出す <a> 要素を生成する。
 * SPA ルーティングのためのリンクコンポーネント。
 *
 * @example
 * ```typescript
 * yield* RouterLink({
 *   href: "/about",
 *   activeClass: "active",
 *   children: () => text("About"),
 * });
 * ```
 */

import type { Render } from "@ydant/core";
import { a, on, attr } from "@ydant/base";
import type { RouterLinkProps } from "./types";
import { currentRoute } from "./state";
import { navigate } from "./navigation";

/**
 * RouterLink コンポーネント
 *
 * クリック時にブラウザのデフォルト動作を防ぎ、
 * History API を使用して SPA ルーティングを行う。
 *
 * @param props - RouterLink のプロパティ
 * @param props.href - リンク先のパス
 * @param props.children - リンクの子要素
 * @param props.activeClass - アクティブ時に適用するクラス名（オプション）
 * @returns リンク要素の Render
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
