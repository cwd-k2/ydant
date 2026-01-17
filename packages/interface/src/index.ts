// Iterator or Iterable として統一的に扱うためのもの
export type Sequence<T, TReturn = unknown, TNext = unknown> =
  | Iterator<T, TReturn, TNext>
  | Iterable<T, TReturn, TNext>;

// inject する用 (独自コンポーネント専用)
type Inject<K> = { type: "inject"; key: K };

type Injector<T extends Record<string, any>> = {
  [K in keyof T]: Inject<K>;
}[keyof T];

type InjectorFn<T> = <K extends keyof T>(key: K) => Iterator<Inject<K>, T[K], T[K]>;

// provide する用 (独自コンポーネント専用)
type Provide<K, V> = { type: "provide"; key: K; value: V };

type Provider<T extends Record<string, any>> = {
  [K in keyof T]: Provide<K, T[K]>;
}[keyof T];

type ProviderFn<T> = <K extends keyof T, V extends T[K]>(
  key: K,
  value: V
) => Iterator<Provide<K, V>, void, void>;

// HTML 要素専用 属性やイベントリスナの登録
export type Attribute = { type: "attribute"; key: string; value: string };
export type EventListener = {
  type: "eventlistener";
  key: string;
  value: (e: Event) => void;
};

// テキストノード
export type Text = { type: "text"; content: string };

// 子要素として yield できるもの
export type Child = Element | Attribute | EventListener | Text;

// Refresher は子要素を生成する関数を受け取り、再レンダリングする
export interface Refresher {
  (children: () => Sequence<Child, void, Refresher | void>): void;
}

// 実際にレンダリングに利用する HTML 要素の定義
export type Element = {
  type: "element";
  tag: string;
  holds: Sequence<Child, void, Refresher | void>;
};

// ElementGen は Element を yield し、最終的に Refresher を返すジェネレーター
export interface ElementGen extends Generator<Element, Refresher, Refresher> {}

export interface Component<T extends Record<string, any>> {
  (
    arg: (
      provide: ProviderFn<T>
    ) => Sequence<Provider<T> | Child, void, Refresher | void>
  ): ElementGen;
}

type Injectee<T extends Record<string, any>> = T[keyof T];

export interface ComposeFn<T extends Record<string, any>> {
  (
    arg: (inject: InjectorFn<T>) => Sequence<Injector<T>, ElementGen, Injectee<T>>
  ): Component<T>;
}
