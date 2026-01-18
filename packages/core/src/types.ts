// =============================================================================
// Utility Types
// =============================================================================

/** Tagged Union を作成するヘルパー型 */
export type Tagged<T extends string, P = {}> = { type: T } & P;

// =============================================================================
// Primitive Types (Leaf nodes)
// =============================================================================

/** HTML 属性 */
export type Attribute = Tagged<"attribute", { key: string; value: string }>;

/** イベントリスナ */
export type Listener = Tagged<"listener", { key: string; value: (e: Event) => void }>;

/** DOM 要素への直接アクセス */
export type Tap = Tagged<"tap", { callback: (el: HTMLElement) => void }>;

/** テキストノード */
export type Text = Tagged<"text", { content: string }>;

// =============================================================================
// Element Types
// =============================================================================

/** HTML 要素の装飾 (Attribute, Listener, Tap) */
export type Decoration = Attribute | Listener | Tap;

/** 子要素として yield できるもの */
export type Child = Element | Decoration | Text;

/** Child を yield するジェネレーター */
export type ChildGen = Generator<Child, unknown, unknown>;

/** 子要素の Iterator */
export type Children = Iterator<Child, void, Refresher | void>;

/** 子要素を生成する関数 */
export type ChildrenFn = () => Children | ChildGen[];

/** Refresher は子要素を生成する関数を受け取り、再レンダリングする */
export interface Refresher {
  (children: ChildrenFn): void;
}

/** HTML 要素 */
export type Element = Tagged<
  "element",
  { tag: string; holds: Children; extras?: Decoration[]; ns?: string }
>;

/** Element を yield し、最終的に Refresher を返すジェネレーター */
export type ElementGenerator = Generator<Element, Refresher, Refresher>;

// =============================================================================
// Component Types
// =============================================================================

/** ルートコンポーネント（ElementGenerator を返す関数） */
export type Component = () => ElementGenerator;
