/**
 * @ydant/base - PluginAPI 拡張
 *
 * core の PluginAPI を拡張し、DOM 操作に必要なメソッドを追加する
 */

import type { Builder, PluginAPI } from "@ydant/core";
import type { Element, Attribute, Listener, Text, Lifecycle, Key, Slot } from "./types";

/** Keyed 要素の情報 */
export interface KeyedNode {
  key: string | number;
  node: globalThis.Element;
  unmountCallbacks: Array<() => void>;
}

/**
 * DOM 操作に必要な基本 API
 *
 * これらのメソッドは core の render システムで実装され、
 * プラグインが DOM を操作するために使用する
 */
export interface BasePluginAPI {
  /** 現在の親ノード */
  readonly parent: Node;
  /** 現在処理中の要素 */
  readonly currentElement: globalThis.Element | null;

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

  /** 新しい子コンテキストの API を作成（戻り値は PluginAPIExtensions） */
  createChildAPI(parent: Node): PluginAPI;
}

/**
 * Element 処理用の追加 API
 *
 * keyed 要素の管理やライフサイクル制御に必要なメソッド
 */
export interface ElementPluginAPIExtensions {
  /** 次の要素に関連付けるキー */
  readonly pendingKey: string | number | null;
  /** pending key を設定 */
  setPendingKey(key: string | number | null): void;

  /** 現在の要素が再利用されたかどうか */
  readonly isCurrentElementReused: boolean;

  /** keyed node を取得 */
  getKeyedNode(key: string | number): KeyedNode | undefined;
  /** keyed node を設定 */
  setKeyedNode(key: string | number, node: KeyedNode): void;
  /** keyed node を削除 */
  deleteKeyedNode(key: string | number): void;

  /** unmount コールバックを追加 */
  pushUnmountCallbacks(...callbacks: Array<() => void>): void;

  /** mount コールバックを実行 */
  executeMount(): void;

  /** 現在の要素を設定 */
  setCurrentElement(element: globalThis.Element | null): void;

  /** 親を設定 */
  setParent(parent: Node): void;
}

// Module augmentation で RenderContext, PluginAPI, Child/Next/Return 型を拡張
declare module "@ydant/core" {
  // RenderContext に base プラグイン用のプロパティを追加
  interface RenderContextExtensions {
    /** 次の要素に関連付けるキー */
    pendingKey: string | number | null;
    /** キー付き要素のマップ */
    keyedNodes: Map<string | number, KeyedNode>;
  }

  // BasePluginAPI と ElementPluginAPIExtensions のすべてのメソッドを追加
  interface PluginAPIExtensions {
    // === BasePluginAPI ===
    /** 現在の親ノード */
    readonly parent: Node;
    /** 現在処理中の要素 */
    readonly currentElement: globalThis.Element | null;

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

    // === ElementPluginAPIExtensions ===
    /** 次の要素に関連付けるキー */
    readonly pendingKey: string | number | null;
    /** pending key を設定 */
    setPendingKey(key: string | number | null): void;

    /** 現在の要素が再利用されたかどうか */
    readonly isCurrentElementReused: boolean;

    /** keyed node を取得 */
    getKeyedNode(key: string | number): KeyedNode | undefined;
    /** keyed node を設定 */
    setKeyedNode(key: string | number, node: KeyedNode): void;
    /** keyed node を削除 */
    deleteKeyedNode(key: string | number): void;

    /** unmount コールバックを追加 */
    pushUnmountCallbacks(...callbacks: Array<() => void>): void;

    /** mount コールバックを実行 */
    executeMount(): void;

    /** 現在の要素を設定 */
    setCurrentElement(element: globalThis.Element | null): void;

    /** 親を設定 */
    setParent(parent: Node): void;
  }

  // base の DSL 型を Child に追加
  interface PluginChildExtensions {
    Element: Element;
    Attribute: Attribute;
    Listener: Listener;
    Text: Text;
    Lifecycle: Lifecycle;
    Key: Key;
  }

  // Slot を ChildNext に追加（Element の yield* で受け取る値）
  interface PluginNextExtensions {
    Slot: Slot;
  }

  // Slot を ChildReturn に追加（Component の戻り値）
  interface PluginReturnExtensions {
    Slot: Slot;
  }
}
