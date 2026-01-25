/**
 * DOM Renderer 内部型定義
 */

import type { DomPlugin } from "./plugin";

/** Keyed 要素の情報 */
export interface KeyedNode {
  key: string | number;
  node: globalThis.Element;
  unmountCallbacks: Array<() => void>;
}

/** レンダリングコンテキスト */
export interface RenderContext {
  /** 親ノード */
  parent: Node;
  /** 現在処理中の要素 */
  currentElement: globalThis.Element | null;
  /** 現在の要素が再利用されたかどうか（リスナー・ライフサイクルの重複登録を防ぐ） */
  isCurrentElementReused: boolean;
  /** マウント時に実行するコールバック */
  mountCallbacks: Array<() => void | (() => void)>;
  /** アンマウント時に実行するコールバック */
  unmountCallbacks: Array<() => void>;
  /** 次の要素に関連付けるキー */
  pendingKey: string | number | null;
  /** キー付き要素のマップ */
  keyedNodes: Map<string | number, KeyedNode>;
  /** Context の値を保持するマップ */
  contextValues: Map<symbol, unknown>;
  /** 登録されたプラグイン */
  plugins: Map<string, DomPlugin>;
}
