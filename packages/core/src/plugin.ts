/**
 * @ydant/core - プラグインシステム
 */

import type { Child, ChildNext } from "./types";
import type { RenderContext, RenderContextCore, RenderContextExtension } from "./render/types";

// =============================================================================
// Plugin API Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って以下のインターフェースを
// 拡張することで、PluginAPI に独自のメソッドを追加できる。
//
// @ydant/base が BasePluginAPI を追加し、DOM 操作に必要なメソッドを提供する。
// =============================================================================

/**
 * プラグインが使用できる API
 *
 * プラグインは declare module "@ydant/core" を使ってこのインターフェースを
 * 拡張することで、独自のメソッドを追加できる。
 *
 * @example
 * ```typescript
 * // @ydant/base で DOM 操作用のメソッドを追加
 * declare module "@ydant/core" {
 *   interface PluginAPI extends BasePluginAPI {}
 * }
 * ```
 */
export interface PluginAPI {}

/**
 * プラグインの処理結果
 */
export interface PluginResult {
  /** ジェネレータに返す値 */
  value?: ChildNext | undefined;
}

/**
 * DOM レンダラープラグイン
 */
export interface Plugin {
  /** プラグイン識別子 */
  readonly name: string;
  /** このプラグインが処理する type タグの配列 */
  readonly types: readonly string[];
  /** 依存するプラグインの name 配列 */
  readonly dependencies?: readonly string[];
  /**
   * RenderContext を初期化する
   *
   * mount 時および子コンテキスト作成時に呼び出される。
   * プラグインは RenderContextExtension で定義した独自プロパティを
   * ここで初期化する。
   *
   * @param ctx - 初期化対象のコンテキスト（構築途中のため Partial）
   * @param parentCtx - 親コンテキスト（ルートの場合は undefined）
   */
  initContext?(
    ctx: RenderContextCore & Partial<RenderContextExtension>,
    parentCtx?: RenderContext,
  ): void;
  /**
   * PluginAPI を拡張する
   *
   * プラグイン固有のメソッドを PluginAPI に追加する。
   * PluginAPI で定義した独自のメソッドをここで実装する。
   *
   * @param api - 拡張対象の PluginAPI オブジェクト
   * @param ctx - 現在の RenderContext（initContext 後なので構築済み）
   */
  extendAPI?(api: Partial<PluginAPI>, ctx: RenderContext): void;
  /**
   * 子コンテキストの状態を親コンテキストにマージする
   *
   * processChildren 内で子イテレータ処理後に呼び出される。
   * プラグインは子コンテキストから親コンテキストへの状態伝搬をここで実装する。
   *
   * @param parentCtx - 親コンテキスト
   * @param childCtx - 子コンテキスト
   */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
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
