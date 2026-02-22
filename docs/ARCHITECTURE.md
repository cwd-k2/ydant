# Ydant Architecture Guide

> 想定読者: コントリビューター、長期メンテナー、設計を深く理解したい利用者

## 全体像

Ydant は **JavaScript ジェネレーターを DSL として使う** レンダリングライブラリ。ユーザーは `yield*` で操作を宣言し、ランタイムがそれを解釈・実行する。

```
┌──────────────────────────────────────────────────────────────┐
│  ユーザーコード（Component / Builder）                        │
│                                                              │
│  function* App(): Render {                                   │
│    yield* div(function* () {                                 │
│      yield* text("Hello");       ← Spell（操作の宣言）      │
│      yield* reactive(() => ...); ← Plugin が処理            │
│    });                                                       │
│  }                                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │ yield
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  @ydant/core — 処理系                                        │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ processIter │→ │ Plugin.      │→ │ RenderContext       │  │
│  │ (dispatch)  │  │ process()    │  │ (per-scope state)   │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                              │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Hub        │→ │ Engine   │→ │ Scheduler (flush timing) │ │
│  │ (orchestr.)│  │ (queue)  │  │ sync/microtask/animFrame │ │
│  └────────────┘  └──────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                     │ capability calls
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend（能力提供）                                         │
│                                                              │
│  createDOMBackend()    → tree/decorate/interact/schedule     │
│  createCanvasBackend() → tree/decorate/schedule              │
│  createSSRBackend()    → tree/decorate/interact/schedule     │
└──────────────────────────────────────────────────────────────┘
```

---

## 概念マップ

### Spell → Request → Plugin → Response

```
ユーザー                   ランタイム内部              プラグイン
─────────                 ──────────────              ──────────
yield* text("hi")    →   { type: "text", ... }   →  basePlugin.process()
       │                         │                         │
    Spell<"text">            Request                   Response (void)
       │                         │                         │
    (generator)           processIterator            plugin dispatch
```

**Spell** はユーザーが `yield*` で呼ぶ操作の型。SpellSchema で登録される。

```typescript
// SpellSchema — spell の型レジストリ（代表的なエントリ）
// 各パッケージが module augmentation で追加する。全量は各パッケージの global.d.ts を参照
interface SpellSchema {
  element: { request: Element; response: Slot; capabilities: "tree" | "decorate" };
  text: { request: Text; capabilities: "tree" };
  reactive: { request: Reactive; capabilities: "tree" | "decorate" };
  boundary: { request: Boundary; capabilities: never };
  "context-provide": { request: ContextProvide; capabilities: never };
  embed: { request: Embed; response: Engine; capabilities: never };
  // ... lifecycle, svg, shape, portal, transition, chunked 等
}
```

**capabilities** フィールドが型レベル効果追跡を可能にする。`mount()` 時に Backend が提供する能力と Spell が要求する能力をコンパイル時に照合する。

### Request/Response サイクル

```
Generator            processIterator              Plugin
────────            ─────────────────             ──────
  │                                                 │
  ├─ yield request ──→ pluginMap.get(type) ─────→ process(request, ctx)
  │                                                 │
  │ ← ──── iter.next(response) ← ──────────────── return response
  │                                                 │
  ├─ yield request ──→ ...                          │
  │                                                 │
  └─ return (done)                                  │
```

`processIterator` はジェネレーターの co-routine ループ。各 yield を受け取り、対応する Plugin に dispatch し、返り値を `iter.next()` で渡し返す。

---

## Scope / Backend / Plugin の関係

### ExecutionScope — 「何が使えるか」の束

```
ExecutionScope
├── backend: Backend         ← 「どこに」レンダリングするか
│   ├── name: "dom"
│   ├── root: HTMLElement
│   ├── initContext(ctx)     ← tree/decorate/interact/schedule を注入
│   └── defaultScheduler     ← Engine の既定タイミング
│
├── pluginMap: Map<type, Plugin>  ← spell type → Plugin の dispatch テーブル
│   ├── "element"  → basePlugin
│   ├── "text"     → basePlugin
│   ├── "reactive" → reactivePlugin
│   ├── "boundary" → asyncPlugin
│   └── "embed"    → embedPlugin
│
└── allPlugins: Plugin[]     ← lifecycle hook 用（initContext, mergeChildContext 等）
    ├── embedPlugin
    ├── basePlugin
    ├── reactivePlugin
    └── asyncPlugin
```

**Backend** は能力（Capability）を提供する:

| Capability                             | DOM | Canvas | SSR         |
| -------------------------------------- | --- | ------ | ----------- |
| tree (createElement, appendChild, ...) | Yes | Yes    | Yes         |
| decorate (setAttribute, ...)           | Yes | Yes    | Yes         |
| interact (addEventListener, ...)       | Yes | No     | Yes (no-op) |
| schedule (scheduleCallback = rAF)      | Yes | Yes    | Yes (no-op) |

**Plugin** は spell の処理方法を教える:

| Plugin         | types                                   | 主な責務                           |
| -------------- | --------------------------------------- | ---------------------------------- |
| embedPlugin    | `["embed"]`                             | scope 切り替え、Engine spawn       |
| basePlugin     | `["element", "text", ...]`              | DOM 要素生成、Slot 管理、lifecycle |
| reactivePlugin | `["reactive"]`                          | signal 追跡、再描画                |
| asyncPlugin    | `["boundary"]`                          | エラーハンドラチェーン登録         |
| contextPlugin  | `["context-provide", "context-inject"]` | Context 値の伝搬                   |

### Plugin のライフサイクルフック

```
mount() 開始
  │
  ├── createRenderContext()
  │     ├── backend.initContext(ctx)     ← 能力注入
  │     └── plugin.initContext(ctx, parentCtx)  ← プラグイン状態初期化
  │
  ├── plugin.setup(rootCtx)             ← mount スコープ全体の初期化
  │
  ├── processIterator(gen, ctx)         ← spell dispatch ループ
  │     ├── plugin.process(request, ctx)
  │     └── plugin.mergeChildContext(parentCtx, childCtx)  ← 子→親の状態伝搬
  │
  └── dispose()
        └── plugin.teardown(rootCtx)    ← 逆順で解放
```

---

## RenderContext — ツリー走査の状態

```
RenderContext（per-scope-position）
│
│ ── core fields ──
├── parent: Node              ← 子要素の追加先
├── scope: ExecutionScope     ← 実行環境
├── engine: Engine            ← タスクキュー
├── processChildren(builder, options?)  ← 子コンテキスト生成 + iterator 実行
├── createChildContext(parent)
│
│ ── Backend injected (via initContext) ──
├── tree: TreeCapability
├── decorate: DecorateCapability
├── interact?: InteractCapability
├── schedule: ScheduleCapability
├── currentElement: Node | null
│
│ ── Plugin augmented (via module augmentation + initContext) ──
├── contextValues: Map<symbol, unknown>    ← @ydant/context
├── reactiveScope: ReactiveScope           ← @ydant/reactive
├── handleRenderError?: (error) => boolean ← @ydant/core（async が runtime で設定）
├── keyedNodes: Map<string, Node>          ← @ydant/base
├── mountCallbacks: Function[]             ← @ydant/base
└── unmountCallbacks: Function[]           ← @ydant/base
```

**子コンテキスト生成の流れ:**

```
ctx.processChildren(builder, { parent?, scope?, contextInit? })
  │
  ├── childCtx = createRenderContext(scope, parent, ctx)
  │     ├── backend.initContext(childCtx)
  │     └── plugins.forEach(p => p.initContext(childCtx, ctx))
  │
  ├── contextInit?.(childCtx, ctx)      ← 呼び出し元によるコンテキスト上書き
  │
  ├── processIterator(builder(), childCtx)
  │
  └── plugins.forEach(p => p.mergeChildContext(ctx, childCtx))
```

scope パラメータを変えると **実行環境が切り替わる**（embed の仕組み）。

---

## Engine / Hub / Scheduler

### タスクキューと flush

```
signal.set(newValue)
  │
  ├── subscriber()                    ← signal の購読者を呼ぶ
  │     └── engine.enqueue(rerender)  ← タスクをキューに追加
  │
  ├── scheduleFlush()                 ← Scheduler に flush を依頼
  │     └── scheduler(flush)          ← タイミング決定
  │
  └── flush()                         ← 実際の実行
        ├── onBeforeFlush callbacks
        ├── for task of queue:
        │     task()                  ← rerender 実行
        └── onFlush callbacks
```

**Scheduler** は「いつ flush するか」を決める関数:

```typescript
// sync: 即座に flush（テスト用）
const sync: Scheduler = (flush) => flush();

// microtask: 同一 tick 内の変更をバッチ
const microtask: Scheduler = (flush) => queueMicrotask(flush);

// animFrame: フレーム単位でバッチ
const animFrame: Scheduler = (flush) => requestAnimationFrame(flush);
```

**Set dedup**: queue は `Set<() => void>` なので、同じ関数参照は1回だけ実行される。これが reactive のバッチングを実現する。ただし sync scheduler では enqueue のたびに即 flush されるため、異なる enqueue 間の dedup は効かない。

### Hub のオーケストレーション

```
Hub
├── spawn(id, scope, options?) → Engine
├── resolve(scope) → Engine
├── dispatch(target, message)
└── dispose()

┌─────────────────────────────────────────────────────────┐
│  Hub                                                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ primary      │  │ embed-canvas │  │ embed-ssr    │  │
│  │ Engine       │  │ Engine       │  │ Engine       │  │
│  │ (DOM scope)  │  │ (Canvas)     │  │ (SSR scope)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│        │                   │                             │
│        │  dispatch         │ onError → dispatch          │
│        │  (message)        │ (error propagation)         │
│        └───────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

各 Engine は独立したタスクキューを持ち、独立したスケジューラで flush する。embed による cross-scope では新しい Engine が spawn され、エラーは `onError` → `dispatch` で親 Engine に伝搬される。

---

## エントリーポイント

### mount() — 便利な DOM マウント

```typescript
import { mount } from "@ydant/base";

mount("#app", App);
mount("#app", App, { plugins: [createReactivePlugin()] });
```

`mount()` は DOM Backend + Base Plugin を自動構築する convenience 関数。大半のアプリケーションはこれで十分。内部で `scope()` を呼んでいる。

### scope() — 高度なユースケース

Canvas、SSR、embed など複数の Backend や scope 切り替えが必要な場合に直接使う:

```typescript
scope(createDOMBackend(root), [createBasePlugin(), createReactivePlugin()]).mount(App);
```

```
scope(backend, plugins)
  │
  ├── embedPlugin を自動登録（先頭に prepend）
  ├── createExecutionScope(backend, allPlugins)
  │     ├── pluginMap 構築（type → Plugin）
  │     └── 依存関係チェック
  │
  └── ScopeBuilder を返す
        ├── .mount(app, options?)
        │     ├── createHub()
        │     ├── hub.spawn("primary", scope, { scheduler })
        │     ├── render(app(), scope, hub)       ← 同期初回レンダリング
        │     ├── plugins.forEach(p => p.setup())
        │     └── return { hub, dispose() }
        │
        └── .embed(content, options?)             ← Spell<"embed"> を yield
              └── yield { type: "embed", scope, content, scheduler }
```

### mount vs embed

|                  | mount                                | embed                                         |
| ---------------- | ------------------------------------ | --------------------------------------------- |
| 起点             | トップレベル（`scope().mount(App)`） | generator 内（`yield* scope().embed(Scene)`） |
| Hub              | 新規作成                             | 親の Hub を共有                               |
| Engine           | primary を spawn                     | 既存 or 新規 spawn                            |
| 初回レンダリング | 同期                                 | 同期（embed は構造的操作）                    |
| 返り値           | `MountHandle { hub, dispose }`       | `Engine`                                      |
| scope 切り替え   | N/A                                  | cross-scope なら Backend + Plugin が変わる    |

---

## Reactive の仕組み

```
signal(0)                               reactive(() => [...])
  │                                        │
  │  ┌─────────────────────┐               │
  │  │ subscribers: Set    │               │
  │  │  ┌─────────────┐   │  subscribe    │
  │  │  │ subscriber ←─┼───┼──────────────┘
  │  │  └──────┬──────┘   │  (runWithSubscriber)
  │  └─────────┼───────────┘
  │            │
  │  signal.set(1)
  │            │
  │  for sub of subscribers:
  │    scheduleEffect(sub)  ← ReactiveScope 経由でバッチング
  │      └── engine.enqueue(rerender)
  │
  └── rerender()
        ├── unmountCallbacks 実行
        ├── clearChildren(container)
        ├── runInScope + runWithSubscriber
        │     └── processChildren(builder, { parent: container })
        └── (エラー時) ctx.handleRenderError?.(error)  ← boundary 連携
```

**ReactiveScope** は per-mount のバッチング管理。`scheduleEffect` で subscriber を Engine の queue に入れる。同じ subscriber は Set dedup で1回だけ実行。

---

## Error Boundary / Suspense の仕組み

### handleRenderError チェーン

```
yield* ErrorBoundary({
  fallback: (error, reset) => ...,
  content: function* () {
    yield* div(function* () {
      yield* boundary(errorHandler)     ← ctx.handleRenderError をチェーン
      yield* reactive(() => {
        if (bad) throw new Error("!")   ← reactive rerender 中のエラー
        ...
      })
    })
  }
})
```

```
reactive rerender throws
  │
  ├── catch (error)
  │     ctx.handleRenderError?.(error)
  │       │
  │       ├── ErrorBoundary の errorHandler
  │       │     ├── error instanceof Promise? → return false（Suspense に委譲）
  │       │     ├── containerSlot.refresh(fallback)
  │       │     └── return true
  │       │
  │       └── (false なら) parentHandler?.(error)
  │             └── 外側の ErrorBoundary / Suspense
  │
  └── (全て false なら) throw error → Engine flush error
```

**チェーンパターン**: `boundary` spell が呼ばれるたびに、現在の `ctx.handleRenderError` を `parentHandler` としてキャプチャし、新しい関数で置き換える。内側が優先、false なら外側にフォールバック。

### Suspense も同じ仕組み

```
suspenseHandler:
  ├── !(error instanceof Promise)? → return false（ErrorBoundary に委譲）
  ├── containerSlot.refresh(fallback)
  ├── error.then(retry, retry)
  └── return true
```

ErrorBoundary は Error をキャッチし Promise を素通り。Suspense は Promise をキャッチし Error を素通り。チェーンにより正しい boundary に到達する。

---

## Subpath Exports

公開 API の対象（アプリ開発者 vs プラグイン/バックエンド作者）を明確にするため、`@ydant/core` と `@ydant/base` は internals subpath を持つ:

| Import path             | 対象                              | 内容                                                    |
| ----------------------- | --------------------------------- | ------------------------------------------------------- |
| `@ydant/core`           | アプリ開発者、プラグイン作者      | scope, types, schedulers, isTagged                      |
| `@ydant/core/internals` | プラグイン/バックエンド作者       | createHub, toRender, ExecutionScope, Embed 等           |
| `@ydant/base`           | アプリ開発者                      | mount, 要素ファクトリ, プリミティブ, refresh            |
| `@ydant/base/internals` | 拡張プラグイン作者（SSR, Canvas） | processNode, createSlot, executeMount, parseFactoryArgs |

---

## パッケージ依存関係

```
                      @ydant/core
                          │
                      @ydant/base
                          │
       ┌──────┬──────┬────┼────┬──────┬──────┐
       │      │      │    │    │      │      │
   reactive async context │  router transit portal
       │                  │   ion
   devtools           ┌───┴───┐
                   canvas    ssr
```

- **core** は DOM を知らない。Backend と Plugin のインターフェースのみ定義
- **base** は DOM Backend + 基本 spell (element, text, lifecycle 等) を提供
- **全パッケージが core + base に依存する**。base は spell 処理の基盤であり、Backend パッケージ (canvas, ssr) も base の spell 定義を前提とする
- devtools は追加で reactive に依存する（reactive の計装に必要）
- パッケージ間の型共有は module augmentation merge で実現

---

## Module Augmentation パターン

各パッケージが `global.d.ts` で core の interface を拡張する:

```typescript
// @ydant/base/src/global.d.ts
declare module "@ydant/core" {
  interface SpellSchema {
    element: { request: Element; response: Slot; capabilities: "tree" | "decorate" };
    text: { request: Text; capabilities: "tree" };
  }
  interface RenderContext {
    keyedNodes: Map<string | number, unknown>;
    mountCallbacks: Function[];
    unmountCallbacks: Function[];
  }
}

// @ydant/reactive/src/global.d.ts
declare module "@ydant/core" {
  interface SpellSchema {
    reactive: { request: Reactive; capabilities: "tree" | "decorate" };
  }
  interface RenderContext {
    reactiveScope: ReactiveScope;
  }
}
```

TypeScript の declaration merging により、全パッケージの augmentation が統合される。`Request` 型は全ての `SpellSchema[K]["request"]` の union になる。

### vite-plugin-dts の出力パターン

augmentation を持つパッケージの `vite.config.ts`:

```typescript
dts({
  copyDtsFiles: true, // global.d.ts を dist にコピー
  beforeWriteFile(filePath, content) {
    if (filePath.endsWith("index.d.ts")) {
      return { content: '/// <reference path="./global.d.ts" />\n' + content };
    }
  },
});
```

---

## 型レベル効果追跡（CapabilityCheck）

```typescript
// spell の capabilities 宣言
interface SpellSchema {
  element: { ...; capabilities: "tree" | "decorate" };
  reactive: { ...; capabilities: "tree" | "decorate" };
  boundary: { ...; capabilities: never };  // 能力不要
}

// Backend の能力宣言
const backend = createDOMBackend(root);
// Backend<"tree" | "decorate" | "interact" | "schedule">

// mount() 時のコンパイルチェック
scope(backend, plugins).mount(App);
// App の Generator yield type から RequiredCapabilities を抽出
// Backend の ProvidedCapabilities と照合
// 不足があれば __capabilityError 型でコンパイルエラー
```

`CapabilityCheck<G, B>` は:

1. `G` が広い `Render` 型（`Component` 注釈由来）→ チェック skip
2. `G` が具体的な `Spell<...>` → `RequiredCapabilities<G> ⊆ ProvidedCapabilities<B>` を検証
3. 不足があれば `{ __capabilityError: "Missing capabilities: ..." }` で型エラー

---

## DevTools の計装パターン

Engine 自体にイベントコードを入れない原則。外部から monkey-patching で計装する。

```
createDevToolsPlugin()
  │
  ├── setup(ctx)
  │     ├── engine.onBeforeFlush(() => ...)  ← flush 開始観測
  │     ├── engine.onFlush(() => ...)        ← flush 完了観測
  │     └── wrap(hub.spawn)                  ← 新 Engine の追跡
  │
  └── teardown(ctx)
        └── active = false                   ← イベント抑制
```

`onBeforeFlush` / `onFlush` は Engine の公開フック。DevTools はこれらを使い、Engine の内部コードを変更せずに観測する（OpenTelemetry と同じパターン）。
