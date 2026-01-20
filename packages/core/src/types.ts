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

/** DOM 要素への直接アクセス */
export type Tap = Tagged<"tap", { callback: (el: HTMLElement) => void }>;

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
// 以下の型は各プラグインパッケージで使用されるが、Child union 型に含める
// 必要があるため core で定義している。これにより循環依存を回避している。
// - Reactive: @ydant/reactive で使用
// - ContextProvide, ContextInject: @ydant/context で使用
// =============================================================================

/** Context オブジェクト（実装は @ydant/context） */
export interface Context<T> {
  readonly id: symbol;
  readonly defaultValue: T | undefined;
}

/** Context Provider - 値を提供（実装は @ydant/context） */
export type ContextProvide = Tagged<
  "context-provide",
  { context: Context<unknown>; value: unknown }
>;

/** Context Inject - 値を取得（実装は @ydant/context） */
export type ContextInject = Tagged<
  "context-inject",
  { context: Context<unknown> }
>;

/** 子要素を生成する関数（前方宣言用） */
export type ChildrenFn = () => Children | ChildGen[];

/** リアクティブブロック - Signal の変更を追跡して自動更新（実装は @ydant/reactive） */
export type Reactive = Tagged<"reactive", { childrenFn: ChildrenFn }>;

// =============================================================================
// Element Types
// =============================================================================

/** HTML 要素の装飾 (Attribute, Listener, Tap) */
export type Decoration = Attribute | Listener | Tap;

/** 子要素として yield できるもの */
export type Child =
  | Element
  | Decoration
  | Text
  | Lifecycle
  | Style
  | Key
  | Reactive
  | ContextProvide
  | ContextInject;

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
  { tag: string; holds: Children; extras?: Decoration[]; ns?: string }
>;

/** Element を yield し、最終的に Slot を返すジェネレーター */
export type Render = Generator<Element, Slot, Slot>;

// =============================================================================
// Component Types
// =============================================================================

/** ルートコンポーネント（Render を返す関数） */
export type Component = () => Render;

// =============================================================================
// Plugin Types
// =============================================================================

/**
 * プラグインが使用できる API
 */
export interface PluginAPI {
  /** 現在の親ノード */
  readonly parent: Node;
  /** 現在処理中の要素 */
  readonly currentElement: globalThis.Element | null;

  /** Context から値を取得 */
  getContext<T>(id: symbol): T | undefined;
  /** Context に値を設定 */
  setContext<T>(id: symbol, value: T): void;

  /** マウント時のコールバックを登録 */
  onMount(callback: () => void | (() => void)): void;
  /** アンマウント時のコールバックを登録 */
  onUnmount(callback: () => void): void;

  /** 親ノードに子ノードを追加 */
  appendChild(node: Node): void;

  /** 子要素を処理する */
  processChildren(
    childrenFn: ChildrenFn,
    options?: {
      parent?: Node;
      inheritContext?: boolean;
    }
  ): void;

  /** 新しい子コンテキストの API を作成 */
  createChildAPI(parent: Node): PluginAPI;
}

/**
 * プラグインの処理結果
 */
export interface PluginResult {
  /** ジェネレータに返す値 */
  value?: unknown;
}

/**
 * DOM レンダラープラグイン
 */
export interface DomPlugin {
  /** プラグイン識別子 */
  readonly name: string;
  /** このプラグインが処理する type タグの配列 */
  readonly types: readonly string[];
  /** Child を処理する */
  process(child: Child, api: PluginAPI): PluginResult;
}
