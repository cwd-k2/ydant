// =============================================================================
// Utility Types
// =============================================================================

/** Tagged Union を作成するヘルパー型 */
export type Tagged<T extends string, P = {}> = { type: T } & P;

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

/** インラインスタイル */
export type Style = Tagged<"style", { properties: Record<string, string> }>;

/** リスト要素のキー（差分更新用のマーカー） */
export type Key = Tagged<"key", { value: string | number }>;

// =============================================================================
// Plugin Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って以下のインターフェースを
// 拡張することで、独自の型を追加できる。
// =============================================================================

/**
 * プラグインが Child 型を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/reactive で Reactive 型を追加
 * declare module "@ydant/core" {
 *   interface PluginChildExtensions {
 *     Reactive: Tagged<"reactive", { childrenFn: ChildBuilder }>;
 *   }
 * }
 * ```
 */
export interface PluginChildExtensions {}

/**
 * プラグインが next() に渡す値の型を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/context で inject が返す値を追加
 * declare module "@ydant/core" {
 *   interface PluginNextExtensions {
 *     ContextValue: unknown;
 *   }
 * }
 * ```
 */
export interface PluginNextExtensions {}

/**
 * プラグインが return で返す値の型を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/transition で TransitionHandle を追加
 * declare module "@ydant/core" {
 *   interface PluginReturnExtensions {
 *     TransitionHandle: TransitionHandle;
 *   }
 * }
 * ```
 */
export interface PluginReturnExtensions {}

// =============================================================================
// Core Types (プラグイン拡張前)
// =============================================================================

type CoreChild = Element | Decoration | Text | Lifecycle | Style | Key;
type CoreNext = Slot | void;
type CoreReturn = Slot | void;

// =============================================================================
// Extended Types (プラグイン拡張後)
// =============================================================================

/** 子要素として yield できるもの（プラグインによって拡張可能） */
export type Child = CoreChild | PluginChildExtensions[keyof PluginChildExtensions];

/** next() に渡される値の型（プラグインによって拡張可能） */
export type ChildNext = CoreNext | PluginNextExtensions[keyof PluginNextExtensions];

/** return で返される値の型（プラグインによって拡張可能） */
export type ChildReturn = CoreReturn | PluginReturnExtensions[keyof PluginReturnExtensions];

// =============================================================================
// Element Types
// =============================================================================

/** HTML 要素の装飾 (Attribute, Listener) */
export type Decoration = Attribute | Listener;

/** レンダリング命令の Iterator（内部処理用） */
export type Instructor = Iterator<Child, ChildReturn, ChildNext>;

/** 要素ファクトリ（div, span 等）の引数型 */
export type ChildBuilder = () => Instructor | Instruction[];

/** 要素のスロット（DOM 参照と更新関数を持つ） */
export interface Slot {
  /** マウントされた DOM 要素 */
  readonly node: HTMLElement;
  /** 子要素を再レンダリングする */
  refresh(children: ChildBuilder): void;
}

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

/** Element を yield し、最終的に Slot を返すジェネレーター */
export type Render = Generator<Element, Slot, Slot>;

// =============================================================================
// Generator Types
// =============================================================================

/** レンダリング命令（text, attr, on 等）の戻り値型 */
export type Instruction = Generator<Child, ChildReturn, ChildNext>;

// =============================================================================
// Component Types
// =============================================================================

/** ルートコンポーネント（Render を返す関数） */
export type Component = () => Render;
