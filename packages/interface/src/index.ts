// =============================================================================
// Utility Types
// =============================================================================

/** Tagged Union を作成するヘルパー型 */
export type Tagged<T extends string, P = {}> = { type: T } & P;

/** Iterator or Iterable として統一的に扱うための型 */
export type Sequence<T, TReturn = unknown, TNext = unknown> =
  | Iterator<T, TReturn, TNext>
  | Iterable<T, TReturn, TNext>;

// =============================================================================
// Utility Functions
// =============================================================================

/** Sequence を Iterator に変換する */
export function toIterator<T, TReturn, TNext>(
  seq: Sequence<T, TReturn, TNext>
): Iterator<T, TReturn, TNext> {
  if (Symbol.iterator in seq) {
    return (seq as Iterable<T, TReturn, TNext>)[Symbol.iterator]();
  }
  return seq as Iterator<T, TReturn, TNext>;
}

// =============================================================================
// Primitive Types (Leaf nodes)
// =============================================================================

/** HTML 属性 */
export type Attribute = Tagged<"attribute", { key: string; value: string }>;

/** イベントリスナ */
export type EventListener = Tagged<"eventlistener", { key: string; value: (e: Event) => void }>;

/** テキストノード */
export type Text = Tagged<"text", { content: string }>;

// =============================================================================
// Element Types
// =============================================================================

/** 子要素の Sequence 型エイリアス */
export type ChildSequence = Sequence<Child, void, Refresher | void>;

/** Child を yield するジェネレーター（配列形式で使用） */
export type ChildItem = Generator<Child, unknown, unknown>;

/** 子要素を生成する関数の型エイリアス */
export type ChildrenFn = () => ChildSequence | ChildItem[];

/** ChildrenFn の結果を ChildSequence に正規化する */
export function toChildSequence(result: ChildSequence | ChildItem[]): ChildSequence {
  if (Array.isArray(result)) {
    return (function* () {
      for (const gen of result) {
        yield* gen;
      }
    })();
  }
  return result;
}

/** Refresher は子要素を生成する関数を受け取り、再レンダリングする */
export interface Refresher {
  (children: ChildrenFn): void;
}

/** HTML 要素の装飾 (Attribute または EventListener) */
export type Decoration = Attribute | EventListener;

/** HTML 要素 */
export type Element = Tagged<
  "element",
  { tag: string; holds: ChildSequence; extras?: Decoration[] }
>;

/** 子要素として yield できるもの */
export type Child = Element | Attribute | EventListener | Text;

/** ElementGen は Element を yield し、最終的に Refresher を返すジェネレーター */
export interface ElementGen extends Generator<Element, Refresher, Refresher> {}

// =============================================================================
// Type Guards
// =============================================================================

/** Element かどうかを判定 */
export function isElement(value: { type: string }): value is Element {
  return value.type === "element";
}

/** Attribute かどうかを判定 */
export function isAttribute(value: { type: string }): value is Attribute {
  return value.type === "attribute";
}

/** EventListener かどうかを判定 */
export function isEventListener(value: { type: string }): value is EventListener {
  return value.type === "eventlistener";
}

/** Text かどうかを判定 */
export function isText(value: { type: string }): value is Text {
  return value.type === "text";
}

// =============================================================================
// Inject / Provide Types (for Component composition)
// =============================================================================

/** Inject 要求 */
export type Inject<K> = Tagged<"inject", { key: K }>;

/** Inject かどうかを判定 */
export function isInject(value: { type: string }): value is Inject<unknown> {
  return value.type === "inject";
}

/** Provide 提供 */
export type Provide<K, V> = Tagged<"provide", { key: K; value: V }>;

/** Provide かどうかを判定 */
export function isProvide(value: { type: string }): value is Provide<unknown, unknown> {
  return value.type === "provide";
}

/** Injector union 型 */
export type Injector<T extends object> = {
  [K in keyof T]: Inject<K>;
}[keyof T];

/** Provider union 型 */
export type Provider<T extends object> = {
  [K in keyof T]: Provide<K, T[K]>;
}[keyof T];

/** inject 関数の型 */
export type InjectorFn<T> = <K extends keyof T>(key: K) => Generator<Inject<K>, T[K], T[K]>;

/** provide 関数の型 */
export type ProviderFn<T> = <K extends keyof T, V extends T[K]>(
  key: K,
  value: V
) => Generator<Provide<K, V>, void, void>;

/** Inject された値の union 型 */
export type Injectee<T extends object> = T[keyof T];

// =============================================================================
// Component Types
// =============================================================================

/** コンポーネント */
export interface Component<T extends object> {
  (
    arg: (provide: ProviderFn<T>) => Sequence<Provider<T> | Decoration, void, void>
  ): ElementGen;
}

/** コンポーネント定義関数 */
export interface ComposeFn<T extends object> {
  (
    arg: (inject: InjectorFn<T>) => Sequence<Injector<T>, ElementGen, Injectee<T>>
  ): Component<T>;
}

/** アプリケーションのルートコンポーネント */
export type App = Component<{}>;
