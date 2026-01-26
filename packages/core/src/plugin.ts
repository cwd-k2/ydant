/**
 * @ydant/core - プラグインシステム
 */

import type { Child } from "./types";

// =============================================================================
// Plugin API Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って以下のインターフェースを
// 拡張することで、PluginAPI に独自のメソッドを追加できる。
//
// @ydant/base が BasePluginAPI を追加し、DOM 操作に必要なメソッドを提供する。
// =============================================================================

/**
 * プラグインが PluginAPI を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/base で DOM 操作用のメソッドを追加
 * declare module "@ydant/core" {
 *   interface PluginAPIExtensions extends BasePluginAPI {}
 * }
 * ```
 */
export interface PluginAPIExtensions {}

/**
 * プラグインが使用できる API
 *
 * 実際のメソッドは @ydant/base の PluginAPIExtensions 拡張で定義される
 */
export type PluginAPI = PluginAPIExtensions;

/**
 * プラグインの処理結果
 */
export interface PluginResult {
  /** ジェネレータに返す値 */
  value?: unknown;
}

/**
 * DOM レンダラープラグイン
 */
export interface Plugin {
  /** プラグイン識別子 */
  readonly name: string;
  /** このプラグインが処理する type タグの配列 */
  readonly types: readonly string[];
  /** Child を処理する */
  process(child: Child, api: PluginAPI): PluginResult;
}

/**
 * mount のオプション
 */
export interface MountOptions {
  /** 使用するプラグインの配列 */
  plugins?: Plugin[];
}
