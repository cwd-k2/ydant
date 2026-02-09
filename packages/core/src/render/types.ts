/**
 * @ydant/core - レンダリング内部型定義
 */

import type { Plugin } from "../plugin";

// =============================================================================
// RenderContext
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って RenderContext を
// 拡張することで、独自のプロパティを追加できる。
//
// @ydant/base が keyedNodes 等を追加
// @ydant/context が contextValues を追加
// =============================================================================

/**
 * レンダリングコンテキスト
 *
 * コアフィールド（parent, currentElement, plugins）を持ち、
 * プラグインは declare module で独自のプロパティを追加できる。
 *
 * @example
 * ```typescript
 * declare module "@ydant/core" {
 *   interface RenderContext {
 *     keyedNodes: Map<string | number, unknown>;
 *   }
 * }
 * ```
 */
export interface RenderContext {
  /** 親ノード */
  parent: Node;
  /** 現在処理中の要素 */
  currentElement: globalThis.Element | null;
  /** 登録されたプラグイン */
  plugins: Map<string, Plugin>;
  /** キャッシュされた RenderAPI（内部用） */
  _cachedAPI?: import("../plugin").RenderAPI;
}
