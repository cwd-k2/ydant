/**
 * @ydant/core - レンダリング内部型定義
 */

import type { Plugin } from "../plugin";

// =============================================================================
// RenderContext Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って RenderContextExtensions を
// 拡張することで、RenderContext に独自のプロパティを追加できる。
//
// @ydant/base が pendingKey, keyedNodes を追加
// @ydant/context が contextValues を追加
// =============================================================================

/**
 * プラグインが RenderContext を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/base で keyed 要素管理用のプロパティを追加
 * declare module "@ydant/core" {
 *   interface RenderContextExtensions {
 *     pendingKey: string | number | null;
 *     keyedNodes: Map<string | number, unknown>;
 *   }
 * }
 * ```
 */
export interface RenderContextExtensions {}

/** レンダリングコンテキスト（コア部分） */
export interface RenderContextCore {
  /** 親ノード */
  parent: Node;
  /** 現在処理中の要素 */
  currentElement: globalThis.Element | null;
  /** 現在の要素が再利用されたかどうか（リスナー・ライフサイクルの重複登録を防ぐ） */
  isCurrentElementReused: boolean;
  /** 登録されたプラグイン */
  plugins: Map<string, Plugin>;
}

/** レンダリングコンテキスト */
export type RenderContext = RenderContextCore & RenderContextExtensions;
