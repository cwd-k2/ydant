/**
 * DOM Renderer Plugin System
 *
 * プラグインを使って DOM レンダラーの機能を拡張する。
 */

import type { Child, Builder } from "@ydant/core";

/**
 * プラグインが使用できる API
 */
export interface PluginAPI {
  /** 現在の親ノード */
  readonly parent: Node;
  /** 現在処理中の要素 */
  readonly currentElement: globalThis.Element | null;

  /** Context から値を取得 */
  getContext<T>(id: symbol): T | undefined;
  /** Context に値を設定 */
  setContext<T>(id: symbol, value: T): void;

  /** マウント時のコールバックを登録 */
  onMount(callback: () => void | (() => void)): void;
  /** アンマウント時のコールバックを登録 */
  onUnmount(callback: () => void): void;

  /** 親ノードに子ノードを追加 */
  appendChild(node: Node): void;

  /** 子要素を処理する */
  processChildren(
    builder: Builder,
    options?: {
      parent?: Node;
      inheritContext?: boolean;
    },
  ): void;

  /** 新しい子コンテキストの API を作成 */
  createChildAPI(parent: Node): PluginAPI;
}

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
export interface DomPlugin {
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
  plugins?: DomPlugin[];
}
