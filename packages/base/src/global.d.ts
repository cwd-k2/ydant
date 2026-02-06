/**
 * @ydant/base - Module Augmentation
 *
 * core の interface を拡張し、base プラグインの型を追加する
 */

import type { Builder, PluginAPI } from "@ydant/core";
import type { Element, Attribute, Listener, Text, Lifecycle, Key, Slot, KeyedNode } from "./types";

declare module "@ydant/core" {
  // RenderContext に base プラグイン用のプロパティを追加
  interface RenderContextExtensions {
    /** 現在の要素が再利用されたかどうか（リスナー・ライフサイクルの重複登録を防ぐ） */
    isCurrentElementReused: boolean;
    /** 次の要素に関連付けるキー */
    pendingKey: string | number | null;
    /** キー付き要素のマップ */
    keyedNodes: Map<string | number, KeyedNode>;
    /** マウント時に実行するコールバック */
    mountCallbacks: Array<() => void | (() => void)>;
    /** アンマウント時に実行するコールバック */
    unmountCallbacks: Array<() => void>;
  }

  // PluginAPI に base プラグインのメソッドを追加
  interface PluginAPIExtensions {
    // === DOM 操作 ===
    /** 現在の親ノード */
    readonly parent: Node;
    /** 現在処理中の要素 */
    readonly currentElement: globalThis.Element | null;
    /** 現在の要素を設定 */
    setCurrentElement(element: globalThis.Element | null): void;
    /** 親を設定 */
    setParent(parent: Node): void;
    /** 親ノードに子ノードを追加 */
    appendChild(node: Node): void;

    // === ライフサイクル ===
    /** マウント時のコールバックを登録 */
    onMount(callback: () => void | (() => void)): void;
    /** アンマウント時のコールバックを登録 */
    onUnmount(callback: () => void): void;
    /** unmount コールバックを追加 */
    addUnmountCallbacks(...callbacks: Array<() => void>): void;
    /** mount コールバックを実行 */
    executeMount(): void;
    /** 現在のコンテキストの unmount コールバックを取得 */
    getUnmountCallbacks(): Array<() => void>;

    // === 子要素処理 ===
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

    // === keyed 要素 ===
    /** 次の要素に関連付けるキー */
    readonly pendingKey: string | number | null;
    /** pending key を設定 */
    setPendingKey(key: string | number | null): void;
    /** 現在の要素が再利用されたかどうか */
    readonly isCurrentElementReused: boolean;
    /** 要素再利用フラグを設定 */
    setCurrentElementReused(reused: boolean): void;
    /** keyed node を取得 */
    getKeyedNode(key: string | number): KeyedNode | undefined;
    /** keyed node を設定 */
    setKeyedNode(key: string | number, node: KeyedNode): void;
    /** keyed node を削除 */
    deleteKeyedNode(key: string | number): void;
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
