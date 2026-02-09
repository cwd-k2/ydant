/**
 * @ydant/core - レンダリング内部型定義
 */

import type { Plugin } from "../plugin";

// =============================================================================
// RenderContext Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って RenderContextExtension を
// 拡張することで、RenderContext に独自のプロパティを追加できる。
//
// @ydant/base が keyedNodes 等を追加
// @ydant/context が contextValues を追加
// =============================================================================

/**
 * プラグインが RenderContext を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/base で keyed 要素管理用のプロパティを追加
 * declare module "@ydant/core" {
 *   interface RenderContextExtension {
 *     keyedNodes: Map<string | number, unknown>;
 *   }
 * }
 * ```
 */
export interface RenderContextExtension {}

/** レンダリングコンテキスト（コア部分） */
export interface RenderContextCore {
  /** 親ノード */
  parent: Node;
  /** 現在処理中の要素 */
  currentElement: globalThis.Element | null;
  /** 登録されたプラグイン */
  plugins: Map<string, Plugin>;
  /** キャッシュされた PluginAPI（内部用） */
  _cachedAPI?: import("../plugin").PluginAPI;
}

/** レンダリングコンテキスト */
export type RenderContext = RenderContextCore & RenderContextExtension;
