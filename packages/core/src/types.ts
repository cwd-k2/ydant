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

/** テキストノード */
export type Text = Tagged<"text", { content: string }>;

// =============================================================================
// Element Types
// =============================================================================

/** HTML 要素の装飾 (Attribute または Listener) */
export type Decoration = Attribute | Listener;

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
  { tag: string; holds: Children; extras?: Decoration[] }
>;

/** Element を yield し、最終的に Refresher を返すジェネレーター */
export type ElementGenerator = Generator<Element, Refresher, Refresher>;

// =============================================================================
// Inject / Provide Types (for Component composition)
// =============================================================================

/** Inject 要求 */
export type Inject<K> = Tagged<"inject", { key: K }>;

/** Provide 提供 */
export type Provide<K, V> = Tagged<"provide", { key: K; value: V }>;

/** inject 関数の型 */
export type InjectorFn<T> = <K extends keyof T>(key: K) => Generator<Inject<K>, T[K], T[K]>;

/** provide 関数の型 */
export type ProviderFn<T> = <K extends keyof T, V extends T[K]>(
  key: K,
  value: V
) => Generator<Provide<K, V>, void, void>;

// =============================================================================
// Component Types
// =============================================================================

/** コンポーネント定義関数の引数 */
export type BuildFn<T extends object> = (
  inject: InjectorFn<T>
) => Iterator<Inject<keyof T>, ElementGenerator, T[keyof T]>;

/** コンポーネント使用時の引数 */
export type RenderFn<T extends object> = (
  provide: ProviderFn<T>
) => Iterator<Provide<keyof T, T[keyof T]> | Decoration, void, void>;

/** コンポーネント */
export interface Component<T extends object> {
  (render: RenderFn<T>): ElementGenerator;
}

/** アプリケーションのルートコンポーネント */
export type App = Component<{}>;
