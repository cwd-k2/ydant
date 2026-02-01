/**
 * @ydant/base - DSL 型定義
 */

import type { Tagged, Instructor, Builder, ChildNext } from "@ydant/core";

// =============================================================================
// Slot Types
// =============================================================================

/** 要素のスロット（DOM 参照と更新関数を持つ） */
export interface Slot {
  /** マウントされた DOM 要素 */
  readonly node: HTMLElement;
  /** 子要素を再レンダリングする */
  refresh(children: Builder): void;
}

// =============================================================================
// Render & Component Types
// =============================================================================

/**
 * 要素ファクトリの戻り値型
 *
 * Element を yield し、必ず Slot を返すジェネレーター。
 * 汎用の Render より具体的な型で、yield* div() が Slot を返すことを保証する。
 *
 * ChildNext は void を含むが、Element yield 時は必ず Slot が返される。
 * 型システムでこれを表現するため、Element と Slot のみに限定している。
 */
export type ElementRender = Generator<Element, Slot, ChildNext>;

// =============================================================================
// Core Primitive Types
// =============================================================================

/** HTML 属性 */
export type Attribute = Tagged<"attribute", { key: string; value: string }>;

/** イベントリスナ */
export type Listener = Tagged<"listener", { key: string; value: (e: Event) => void }>;

/** テキストノード */
export type Text = Tagged<"text", { content: string }>;

/** ライフサイクルイベント */
export type Lifecycle = Tagged<
  "lifecycle",
  {
    event: "mount" | "unmount";
    callback: () => void | (() => void);
  }
>;

/** リスト要素のキー（差分更新用のマーカー） */
export type Key = Tagged<"key", { value: string | number }>;

// =============================================================================
// Plugin Types
// =============================================================================

/** Keyed 要素の情報 */
export interface KeyedNode {
  key: string | number;
  node: globalThis.Element;
  unmountCallbacks: Array<() => void>;
}

// =============================================================================
// Element Types
// =============================================================================

/** HTML 要素の装飾 (Attribute, Listener) */
export type Decoration = Attribute | Listener;

/** HTML 要素 */
export type Element = Tagged<
  "element",
  {
    tag: string;
    children: Instructor;
    decorations?: Decoration[];
    ns?: string;
  }
>;
