/**
 * @ydant/core - プラグインシステム
 */

import type { Child, ChildNext } from "./types";
import type { RenderContext } from "./render/types";

// =============================================================================
// Plugin API Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って以下のインターフェースを
// 拡張することで、RenderAPI に独自のメソッドを追加できる。
//
// @ydant/base が BaseRenderAPI を追加し、DOM 操作に必要なメソッドを提供する。
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
 *   interface RenderAPI extends BaseRenderAPI {}
 * }
 * ```
 */
export interface RenderAPI {}

/**
 * プラグインの処理結果
 */
export interface ProcessResult {
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
   * プラグインは RenderContext を declare module で拡張し、
   * ここで独自プロパティを初期化する。
   *
   * @param ctx - 初期化対象のコンテキスト（コアフィールドは設定済み、拡張プロパティは各プラグインが設定）
   * @param parentCtx - 親コンテキスト（ルートの場合は undefined）
   */
  initContext?(ctx: RenderContext, parentCtx?: RenderContext): void;
  /**
   * RenderAPI を拡張する
   *
   * プラグイン固有のメソッドを RenderAPI に追加する。
   * RenderAPI で定義した独自のメソッドをここで実装する。
   *
   * @param api - 拡張対象の RenderAPI オブジェクト
   * @param ctx - 現在の RenderContext（initContext 後なので構築済み）
   */
  extendAPI?(api: Partial<RenderAPI>, ctx: RenderContext): void;
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
  process(child: Child, api: RenderAPI): ProcessResult;
}

/**
 * mount のオプション
 */
export interface MountOptions {
  /** 使用するプラグインの配列 */
  plugins?: Plugin[];
}
