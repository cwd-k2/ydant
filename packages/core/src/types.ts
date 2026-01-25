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
// プラグインは declare module "@ydant/core" を使って PluginChildExtensions
// インターフェースを拡張することで、独自の Child 型を追加できる。
// =============================================================================

/** 子要素を生成する関数（前方宣言用） */
export type ChildrenFn = () => Children | ChildGen[];

/**
 * プラグインが Child 型を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/reactive で Reactive 型を追加
 * declare module "@ydant/core" {
 *   interface PluginChildExtensions {
 *     Reactive: Tagged<"reactive", { childrenFn: ChildrenFn }>;
 *   }
 * }
 * ```
 */
export interface PluginChildExtensions {}

// =============================================================================
// Element Types
// =============================================================================

/** HTML 要素の装飾 (Attribute, Listener) */
export type Decoration = Attribute | Listener;

/** コアが定義する基本的な Child 型 */
type CoreChild = Element | Decoration | Text | Lifecycle | Style | Key;

/** 子要素として yield できるもの（プラグインによって拡張可能） */
export type Child = CoreChild | PluginChildExtensions[keyof PluginChildExtensions];

/** Child を yield するジェネレーター */
export type ChildGen = Generator<Child, unknown, unknown>;

/** 子要素の Iterator */
export type Children = Iterator<Child, void, Slot | void>;

/** 要素のスロット（DOM 参照と更新関数を持つ） */
export interface Slot {
  /** マウントされた DOM 要素 */
  readonly node: HTMLElement;
  /** 子要素を再レンダリングする */
  refresh(children: ChildrenFn): void;
}

/** HTML 要素 */
export type Element = Tagged<
  "element",
  { tag: string; children: Children; decorations?: Decoration[]; ns?: string }
>;

/** Element を yield し、最終的に Slot を返すジェネレーター */
export type Render = Generator<Element, Slot, Slot>;

// =============================================================================
// Component Types
// =============================================================================

/** ルートコンポーネント（Render を返す関数） */
export type Component = () => Render;
