/**
 * Router の型定義
 */

import type { Render, Component } from "@ydant/core";

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
