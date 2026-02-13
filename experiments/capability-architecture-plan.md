# 能力定義層アーキテクチャ — 実行計画

## 前提: 現在のアーキテクチャと目標

### 現状 (RenderTarget モノリス)

```
mount(app, {
  target: createDOMTarget(root),     ← 12メソッドのモノリス
  plugins: [createBasePlugin(), ...],
})
```

- `RenderTarget` は DOM API の形状をそのまま反映
- SSR は「addEventListener = no-op」「scheduleCallback = no-op」
- Hydration は `skipPrepare` ハック + `NodeResolver` 別系統
- Plugin (base) は `ctx.target.xxx()` で全操作を実行

### 目標 (能力注入パターン)

```
mount(app, {
  root,
  isElement: (node) => node instanceof Element,
  plugins: [
    createDOMCapabilities(),          ← 必要な能力を注入
    createBasePlugin(),               ← 純粋なエフェクトハンドラ
    createReactivePlugin(),
  ],
})
```

- 能力は RenderContext augmentation で注入 (既存パターンの再利用)
- Plugin は能力を「使う」だけ、能力を「持つ」のは Capability Provider
- 同じ base plugin が DOM / SSR / Hydration で動作
- 型レベルで必要能力を追跡し mount 時に検証

---

## 全体フェーズ構成

```
Phase 1: 能力インターフェース定義 (core — 純粋追加)
Phase 2: Plugin 拡張 + MountOptions 変更 (core — 破壊的)
Phase 3: DOM 能力プロバイダ (base — 新規)
Phase 4: base plugin 移行 (base — 内部変更)
Phase 5: core 内部移行 (core — 内部変更)
Phase 6: 他プラグイン移行 (reactive 等)
Phase 7: SSR 能力プロバイダ (ssr — 書き換え)
Phase 8: Hydration 再設計 (ssr — 書き換え)
Phase 9: RenderTarget 除去 (core — 最終除去)
Phase 10: 型レベル効果追跡 (全パッケージ)
Phase 11: テスト・ドキュメント整備
```

---

## Phase 1: 能力インターフェース定義

**目標**: 5 能力 + 1 基盤のインターフェースを core に定義する。純粋な追加。

### 新規ファイル: `packages/core/src/capabilities.ts`

```typescript
/**
 * @ydant/core - Capability interfaces
 *
 * 能力 = バックエンドが提供する原始操作の分類。
 * 各能力は RenderContext augmentation でプラグインから注入される。
 */

/** ノードツリーの構築 — ノードを生成し、木構造を組み立てる */
export interface TreeCapability {
  createElement(tag: string): unknown;
  createElementNS(ns: string, tag: string): unknown;
  createTextNode(content: string): unknown;
  appendChild(parent: unknown, child: unknown): void;
  removeChild(parent: unknown, child: unknown): void;
  clearChildren(parent: unknown): void;
}

/** ノードの性質付与 — 属性を設定する */
export interface DecorateCapability {
  setAttribute(node: unknown, key: string, value: string): void;
}

/** イベント応答 — 外部入力に反応する */
export interface InteractCapability {
  addEventListener(node: unknown, type: string, handler: (e: unknown) => void): void;
}

/** 非同期制御 — コールバックをスケジュールする */
export interface ScheduleCapability {
  scheduleCallback(callback: () => void): void;
}

/** 既存ノード取得 — すでに存在するノードを見つける (Hydration 用) */
export interface ResolveCapability {
  nextChild(parent: unknown): unknown | null;
}
```

### 変更: `packages/core/src/index.ts`

```diff
+export type {
+  TreeCapability,
+  DecorateCapability,
+  InteractCapability,
+  ScheduleCapability,
+  ResolveCapability,
+} from "./capabilities";
```

### テスト

型定義のみのため、`pnpm typecheck` で確認。

---

## Phase 2: Plugin 拡張 + MountOptions 変更

**目標**: Plugin に `beforeRender` を追加、`process` を省略可能にする。MountOptions を `root` + `isElement` に変更。

### 設計判断

| 項目                 | 決定                            | 理由                                           |
| -------------------- | ------------------------------- | ---------------------------------------------- |
| `prepare()` の代替   | Plugin の `beforeRender` フック | 能力プロバイダが自分の Tree で prepare できる  |
| `target.root` の代替 | MountOptions.root               | mount ポイントは能力ではなく場所の指定         |
| `isElement` の位置   | MountOptions.isElement          | context 生成時に必要、initContext より前に必要 |
| `process` の必須性   | 省略可能にする                  | 能力プロバイダは Request を処理しない          |

### 変更: `packages/core/src/plugin.ts`

```typescript
export interface RenderContext {
  // target: RenderTarget;  ← 削除
  /** The node that children are appended to. */
  parent: unknown;
  /** The element currently being decorated, or `null` between elements. */
  currentElement: unknown;
  /** Registered plugins keyed by their type tags. */
  plugins: Map<string, Plugin>;
  /** Tests whether a node is an element (foundation capability). */
  isElement(node: unknown): boolean;
  /** Processes a Builder's instructions in a new child context. */
  processChildren(builder: Builder, options?: { parent?: unknown }): void;
  /** Creates a new child-scoped RenderContext for the given parent node. */
  createChildContext(parent: unknown): RenderContext;
}

export interface Plugin {
  readonly name: string;
  readonly types: readonly string[];
  readonly dependencies?: readonly string[];
  setup?(ctx: RenderContext): void;
  teardown?(ctx: RenderContext): void;
  /** Called after context initialization, before the first iterator step. */
  beforeRender?(ctx: RenderContext): void;
  initContext?(ctx: RenderContext, parentCtx?: RenderContext): void;
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /** Optional: processes a single Request. Required if types is non-empty. */
  process?(request: Request, ctx: RenderContext): Response;
}
```

### 変更: `packages/core/src/mount.ts`

```typescript
export interface MountOptions {
  /** The root node to mount into. */
  root: unknown;
  /** Tests whether a node is an element (foundation requirement). */
  isElement: (node: unknown) => boolean;
  /** Plugins to register for this mount scope. */
  plugins?: Plugin[];
}
```

### 変更: `packages/core/src/render/index.ts`

```typescript
export function render(
  gen: Render,
  root: unknown,
  isElement: (node: unknown) => boolean,
  plugins: Map<string, Plugin>,
): RenderContext {
  const ctx = createRenderContext(root, isElement, plugins);

  // Let capability providers prepare (replaces target.prepare())
  forEachUniquePlugin(plugins, (plugin) => {
    plugin.beforeRender?.(ctx);
  });

  processIterator(gen, ctx);
  return ctx;
}
```

### 変更: `packages/core/src/render/context.ts`

```typescript
export function createRenderContextFactory(
  processIterator: (iter: Render, ctx: RenderContext) => void,
) {
  function createRenderContext(
    root: unknown,
    isElement: (node: unknown) => boolean,
    plugins: Map<string, Plugin>,
    parent?: unknown,
    parentCtx?: RenderContext,
  ): RenderContext {
    const actualParent = parent ?? root;
    const ctx = {
      parent: actualParent,
      currentElement: isElement(actualParent) ? actualParent : null,
      plugins,
      isElement,
    } as RenderContext;

    // processChildren, createChildContext は
    // root と isElement をクロージャでキャプチャ
    ctx.processChildren = (builder, options) => {
      const targetParent = options?.parent ?? ctx.parent;
      const childCtx = createRenderContext(root, isElement, ctx.plugins, targetParent, ctx);
      const children = toRender(builder());
      processIterator(children, childCtx);
      forEachUniquePlugin(ctx.plugins, (plugin) => {
        plugin.mergeChildContext?.(ctx, childCtx);
      });
    };

    ctx.createChildContext = (parent) => {
      return createRenderContext(root, isElement, ctx.plugins, parent, ctx);
    };

    forEachUniquePlugin(plugins, (plugin) => {
      plugin.initContext?.(ctx, parentCtx);
    });

    return ctx;
  }

  return createRenderContext;
}
```

### 変更: `packages/core/src/render/iterator.ts`

```diff
 if (plugin) {
-  const response = plugin.process(value as Request, ctx);
+  const response = plugin.process?.(value as Request, ctx);
```

### テスト

- core のテスト全修正 (MountOptions の形状変更)
- この時点では base plugin がまだ ctx.target を使うため、一時的に互換層が必要
  → **ブリッジ戦略**: Phase 2 と Phase 4 を同時に実行し、一度に切り替える

---

## Phase 3: DOM 能力プロバイダ

**目標**: `createDOMTarget` の中身を能力プロバイダ Plugin に変換する。

### 新規ファイル: `packages/base/src/capabilities/dom.ts`

```typescript
import type { Plugin, RenderContext } from "@ydant/core";

export interface DOMCapabilitiesOptions {
  /**
   * Skip clearing root content in beforeRender.
   * Used by hydration to preserve SSR content.
   */
  skipPrepare?: boolean;
}

/**
 * Creates a plugin that provides DOM-based capabilities.
 * Injects tree, decorate, interact, schedule into RenderContext.
 */
export function createDOMCapabilities(options?: DOMCapabilitiesOptions): Plugin {
  return {
    name: "dom-capabilities",
    types: [],

    initContext(ctx: RenderContext) {
      ctx.tree = {
        createElement: (tag) => document.createElement(tag),
        createElementNS: (ns, tag) => document.createElementNS(ns, tag),
        createTextNode: (content) => document.createTextNode(content),
        appendChild: (parent, child) => (parent as Node).appendChild(child as Node),
        removeChild: (parent, child) => (parent as Node).removeChild(child as Node),
        clearChildren: (parent) => {
          (parent as globalThis.Element).innerHTML = "";
        },
      };

      ctx.decorate = {
        setAttribute: (node, key, value) => (node as globalThis.Element).setAttribute(key, value),
      };

      ctx.interact = {
        addEventListener: (node, type, handler) =>
          (node as globalThis.Element).addEventListener(type, handler as EventListener),
      };

      ctx.schedule = {
        scheduleCallback: (cb) => requestAnimationFrame(cb),
      };
    },

    beforeRender(ctx: RenderContext) {
      if (!options?.skipPrepare) {
        ctx.tree.clearChildren(ctx.parent);
      }
    },
  };
}
```

### RenderContext augmentation: `packages/base/src/capabilities/global.d.ts`

```typescript
import type {
  TreeCapability,
  DecorateCapability,
  InteractCapability,
  ScheduleCapability,
} from "@ydant/core";

declare module "@ydant/core" {
  interface RenderContext {
    tree: TreeCapability;
    decorate: DecorateCapability;
    interact: InteractCapability;
    schedule: ScheduleCapability;
  }
}
```

### 公開: `packages/base/src/index.ts`

```diff
+// Capabilities
+export type { DOMCapabilitiesOptions } from "./capabilities/dom";
+export { createDOMCapabilities } from "./capabilities/dom";
```

### 旧 API の扱い

`createDOMTarget` は deprecated にし、内部で `createDOMCapabilities` を呼ぶ互換ラッパーとして残す。Phase 9 で除去。

---

## Phase 4: base plugin 移行

**目標**: base plugin 内の全 `ctx.target.xxx()` を `ctx.tree.xxx()` 等に置き換える。

### 変更マップ

| ファイル               | 変更前                                  | 変更後                                |
| ---------------------- | --------------------------------------- | ------------------------------------- |
| `plugin/element.ts`    | `ctx.target.createElement(tag)`         | `ctx.tree.createElement(tag)`         |
|                        | `ctx.target.createElementNS(ns, tag)`   | `ctx.tree.createElementNS(ns, tag)`   |
|                        | `ctx.target.appendChild(parent, child)` | `ctx.tree.appendChild(parent, child)` |
|                        | `ctx.target.clearChildren(node)`        | `ctx.tree.clearChildren(node)`        |
|                        | `ctx.target.scheduleCallback(cb)`       | `ctx.schedule.scheduleCallback(cb)`   |
|                        | `ctx.target.setAttribute(...)`          | `ctx.decorate.setAttribute(...)`      |
|                        | `ctx.target.addEventListener(...)`      | `ctx.interact.addEventListener(...)`  |
| `plugin/primitives.ts` | `ctx.target.setAttribute(...)`          | `ctx.decorate.setAttribute(...)`      |
|                        | `ctx.target.addEventListener(...)`      | `ctx.interact.addEventListener(...)`  |
|                        | `ctx.target.createTextNode(content)`    | `ctx.tree.createTextNode(content)`    |
|                        | `ctx.target.appendChild(...)`           | `ctx.tree.appendChild(...)`           |

### 具体的な変更数

- `processElement()`: 6 箇所
- `applyDecorations()`: 2 箇所
- `createSlot.refresh()`: 1 箇所
- `executeMount()`: 1 箇所
- `processAttribute()`: 1 箇所
- `processListener()`: 1 箇所
- `processText()`: 2 箇所
- `processLifecycle()`: 0 箇所 (target を使わない)

合計: **14 箇所** の `ctx.target.` → `ctx.tree.` / `ctx.decorate.` / `ctx.interact.` / `ctx.schedule.`

### テスト

base の全テストは DOM 環境 (happy-dom) で動作。テスト内の mount 呼び出しを新しい形式に更新:

```typescript
// Before
mount(App, {
  target: createDOMTarget(root),
  plugins: [createBasePlugin()],
});

// After
mount(App, {
  root,
  isElement: (node) => node instanceof Element,
  plugins: [createDOMCapabilities(), createBasePlugin()],
});
```

---

## Phase 5: core 内部移行

**目標**: core の render/context から RenderTarget 依存を完全に除去する。

### 変更: `packages/core/src/render/context.ts`

Phase 2 で示した変更を適用。`target` パラメータを `root` + `isElement` に置換。

### 変更: `packages/core/src/render/index.ts`

Phase 2 で示した変更を適用。`target.prepare()` を `plugin.beforeRender()` ループに置換。

### 変更: `packages/core/src/mount.ts`

```typescript
export function mount(app: Component, options: MountOptions): MountHandle {
  const { root, isElement, plugins: pluginList } = options;

  const plugins = new Map<string, Plugin>();
  // ... plugin registration (同じ) ...

  const rootCtx = render(app(), root, isElement, plugins);

  // setup phase (同じ)
  // ...

  return {
    dispose() {
      /* 同じ */
    },
  };
}
```

### テスト

core のテスト修正。core テストは最小限の mock で動くはず。

---

## Phase 6: 他プラグイン移行

**目標**: reactive, context, router, async, transition の `ctx.target.xxx()` 呼び出しを能力呼び出しに置換。

### reactive plugin (`packages/reactive/src/plugin.ts`)

```diff
-const container = ctx.target.createElement("span");
-ctx.target.setAttribute(container, "data-reactive", "");
-ctx.target.appendChild(ctx.parent, container);
+const container = ctx.tree.createElement("span");
+ctx.decorate.setAttribute(container, "data-reactive", "");
+ctx.tree.appendChild(ctx.parent, container);

-ctx.target.clearChildren(container);
+ctx.tree.clearChildren(container);
```

4 箇所。

### 他プラグインの ctx.target 使用状況

```
context:   ctx.target 使用なし (processChildren のみ)
router:    ctx.target 使用なし (processChildren + 内部状態のみ)
async:     ctx.target 使用あり? → 要確認
transition: ctx.target 使用あり? → 要確認
```

→ Phase 6 開始時に grep で全箇所を特定する。

---

## Phase 7: SSR 能力プロバイダ

**目標**: SSR の `createStringTarget` を能力プロバイダに変換する。

### 新規/変更: `packages/ssr/src/capabilities.ts`

```typescript
import type { Plugin, RenderContext, TreeCapability, DecorateCapability } from "@ydant/core";
import type { VRoot, VElement, VText, VContainer } from "./vnode";

export function createSSRCapabilities(): Plugin & { toHTML(): string } {
  const root: VRoot = { kind: "root", children: [] };

  const tree: TreeCapability = {
    createElement: (tag): VElement => ({
      kind: "element",
      tag,
      attributes: new Map(),
      children: [],
    }),
    createElementNS: (ns, tag): VElement => ({
      kind: "element",
      tag,
      ns,
      attributes: new Map(),
      children: [],
    }),
    createTextNode: (content): VText => ({ kind: "text", content }),
    appendChild: (parent, child) => {
      (parent as VContainer).children.push(child as VElement | VText);
    },
    removeChild: (parent, child) => {
      const p = parent as VContainer;
      const idx = p.children.indexOf(child as VElement | VText);
      if (idx !== -1) p.children.splice(idx, 1);
    },
    clearChildren: (parent) => {
      (parent as VContainer).children = [];
    },
  };

  const decorate: DecorateCapability = {
    setAttribute: (node, key, value) => {
      (node as VElement).attributes.set(key, value);
    },
  };

  return {
    name: "ssr-capabilities",
    types: [],

    initContext(ctx: RenderContext) {
      ctx.tree = tree;
      ctx.decorate = decorate;
      // interact: NOT provided (SSR has no events)
      // schedule: NOT provided (SSR has no lifecycle)
    },

    beforeRender(ctx: RenderContext) {
      root.children = [];
    },

    toHTML() {
      return serializeChildren(root.children);
    },
  };
}
```

### SSR の能力プロファイル

```
SSR:  Tree ✓  Decorate ✓  Interact ✗  Schedule ✗  Resolve ✗
```

**Interact/Schedule が未提供の影響:**

- `ctx.interact` が undefined → addEventListener 呼び出しでクラッシュ
- `ctx.schedule` が undefined → scheduleCallback 呼び出しでクラッシュ

**解決策**: base plugin が Interact/Schedule を使う箇所でオプショナルチェーンを使うか、SSR 時は listener/lifecycle リクエストをスキップするか。

→ **判断**: SSR 用の base plugin ラッパーは不要。base plugin 自体が能力の有無をチェックする:

```typescript
// processListener
if (!ctx.interact) return;  // No interact capability → skip
ctx.interact.addEventListener(element, listener.key, ...);

// executeMount
if (!ctx.schedule) return;  // No schedule capability → skip
ctx.schedule.scheduleCallback(() => { ... });
```

これは「能力がなければ安全にスキップ」パターン。SSR で addEventListener が no-op だったのと本質的に同じだが、より明示的。

**→ Phase 4 を修正**: base plugin の能力呼び出しに optional chaining を追加するかどうかの判断が必要。

### 代替案: 能力ガードを Plugin 内で行う

実は「同じ base plugin で DOM と SSR を動かす」には 2 つのアプローチがある:

**A. base plugin が能力の有無をチェック (寛容)**

```typescript
// processListener
const element = ctx.currentElement;
if (element && ctx.interact) {
  ctx.interact.addEventListener(element, listener.key, ...);
}
```

**B. SSR は listener/lifecycle リクエストを発行しないコンポーネントのみ使用 (厳格)**

→ 型レベル効果追跡 (Phase 10) でコンパイル時に保証。
→ ランタイムでは crash (バグの早期発見)。

**判断: B を採用。** 理由:

- A は暗黙的な no-op で、デバッグが困難
- B は型システムで保証し、万が一の場合は明確にクラッシュ
- 現在の SSR no-op パターンの問題点がまさにこれ

ただし Phase 10 (型レベル効果追跡) が完成するまでの移行期間中は、ランタイムでわかりやすいエラーメッセージを出す:

```typescript
function requireCapability<T>(cap: T | undefined, name: string): T {
  if (!cap) {
    throw new Error(
      `[ydant] Capability "${name}" is not provided. ` +
        `This operation requires a capability provider that supports "${name}".`,
    );
  }
  return cap;
}
```

---

## Phase 8: Hydration 再設計

**目標**: Hydration を Resolve 能力で表現し、base plugin から分離する。

### 現在の Hydration の問題

1. `createHydrationPlugin` は base plugin をラップし、`process` を上書き
2. element リクエストを「ノード作成」から「ノード取得」に読み替え
3. `skipPrepare` ハックで prepare を殺している
4. hydrating フラグで初期レンダリングとその後を切り替え

### 新しい設計

```
Hydration = Resolve + Interact + Schedule (Tree なし, Decorate なし)
```

- **Resolve 能力プロバイダ**: `createHydrationCapabilities()`
  - `ctx.resolve = { nextChild: ... }` を注入
  - `ctx.interact` = DOM addEventListener
  - `ctx.schedule` = requestAnimationFrame
  - `ctx.tree` は NOT provided (initial render では使わない)

- **Hydration Plugin**: element リクエストを Resolve で処理
  - `isTagged(request, "element")` → `ctx.resolve.nextChild(ctx.parent)` でノード取得
  - text → cursor 進める
  - attribute → skip (SSR 設定済み)
  - listener → `ctx.interact.addEventListener()` で接続
  - lifecycle → 通常処理

- **Post-hydration**: setup() 後は通常の DOM レンダリング
  - Slot.refresh() には Tree + Decorate が必要
  - → setup() で DOM 能力を追加注入するか、最初から Tree も提供するか

### Post-hydration の問題

Slot.refresh() は Tree 能力を使う (clearChildren, appendChild)。Hydration 初期レンダリングでは Tree 不要だが、refresh 時には必要。

**解決策**: Hydration capabilities は全能力を提供する。ただし `beforeRender` で prepare をスキップ:

```typescript
export function createHydrationCapabilities(): Plugin {
  return {
    name: "hydration-capabilities",
    types: [],

    initContext(ctx: RenderContext) {
      // DOM の全能力を注入 (refresh 用)
      ctx.tree = { createElement: ..., ... };
      ctx.decorate = { setAttribute: ... };
      ctx.interact = { addEventListener: ... };
      ctx.schedule = { scheduleCallback: ... };

      // Hydration 固有: Resolve 能力
      ctx.resolve = createDOMNodeResolver();
    },

    // beforeRender: なし (prepare しない = SSR コンテンツを保持)
  };
}
```

Hydration Plugin は:

```typescript
export function createHydrationPlugin(): Plugin {
  let hydrating = true;

  return {
    name: "hydration",
    types: ["element", "text", "attribute", "listener", "lifecycle"],

    setup() {
      hydrating = false;
    },

    process(request, ctx) {
      if (!hydrating) {
        // Post-hydration: delegate to base plugin
        return baseProcess(request, ctx);
      }

      // Hydration mode: use Resolve capability
      if (isTagged(request, "element")) {
        return hydrateElement(request, ctx);
      }
      // ...
    },
  };
}
```

### Resolve augmentation: `packages/ssr/src/global.d.ts`

```typescript
import type { ResolveCapability } from "@ydant/core";

declare module "@ydant/core" {
  interface RenderContext {
    resolve: ResolveCapability;
  }
}
```

---

## Phase 9: RenderTarget 除去

**目標**: core から RenderTarget インターフェースを完全に除去する。

### 変更

1. `packages/core/src/target.ts` — 削除
2. `packages/core/src/index.ts` — `RenderTarget` export 削除
3. `packages/core/src/plugin.ts` — `import type { RenderTarget }` 削除
4. `packages/base/src/target.ts` — 削除 or `createDOMTarget` を `createDOMCapabilities` の alias に
5. `packages/ssr/src/target.ts` — 削除
6. 全テスト・example から `createDOMTarget` / `RenderTarget` 参照を除去

### 検証

```bash
grep -r "RenderTarget\|createDOMTarget\|createStringTarget\|ctx\.target" packages/ examples/
```

ゼロヒットであること。

---

## Phase 10: 型レベル効果追跡

**目標**: DSL プログラムの型から必要能力を自動抽出し、mount 時に検証する。

### Step 10.1: SpellSchema に capabilities フィールドを追加

```typescript
// packages/base/src/global.d.ts
declare module "@ydant/core" {
  interface SpellSchema {
    element: { request: Element; response: Slot; capabilities: "tree" | "decorate" };
    attribute: { request: Attribute; capabilities: "decorate" };
    listener: { request: Listener; capabilities: "interact" };
    text: { request: Text; capabilities: "tree" };
    lifecycle: { request: Lifecycle; capabilities: "schedule" };
  }
}
```

### Step 10.2: 型ユーティリティ (core)

```typescript
// packages/core/src/types.ts に追加

/** SpellSchema エントリ K の必要能力を抽出 */
type CapabilitiesOf<K extends keyof SpellSchema> = SpellSchema[K] extends { capabilities: infer C }
  ? C
  : never;

/** Generator の yield 型から必要能力を自動導出 */
type CapabilitiesOfGenerator<G> =
  G extends Generator<infer Y, unknown, unknown>
    ? Y extends { type: infer T }
      ? T extends keyof SpellSchema
        ? CapabilitiesOf<T>
        : never
      : never
    : never;

/** mount 時の能力検証 */
type CheckCapabilities<G, Provided extends string> =
  CapabilitiesOfGenerator<G> extends Provided
    ? void
    : {
        error: "Missing capabilities";
        required: CapabilitiesOfGenerator<G>;
        provided: Provided;
        missing: Exclude<CapabilitiesOfGenerator<G>, Provided>;
      };
```

### Step 10.3: mount の型シグネチャ更新

```typescript
// アプローチ C (PoC3 で検証済み — 呼び出し側でエラーを出す)
declare function mount<G extends Generator, Provided extends string>(
  app: () => G,
  options: MountOptions & {
    capabilities: Provided; // or derived from plugins
  } & (CapabilitiesOfGenerator<G> extends Provided
      ? {}
      : {
          __error: `Missing: ${Exclude<CapabilitiesOfGenerator<G>, Provided> & string}`;
        }),
): MountHandle;
```

### 未解決: Plugin から Provided 型を導出する方法

Plugin が「自分が提供する能力」を型レベルで宣言する仕組みが必要:

```typescript
interface Plugin<Provides extends string = string> {
  readonly provides?: Provides;
  // ...
}

function createDOMCapabilities(): Plugin<"tree" | "decorate" | "interact" | "schedule"> {
  return { provides: "tree" | "decorate" | "interact" | "schedule" as const, ... };
}
```

mount が plugins 配列から Provided union を導出:

```typescript
type ProvidedBy<P extends Plugin[]> = P[number] extends Plugin<infer C> ? C : never;
```

→ **これは追加の PoC が必要**。Phase 10 開始時に実験する。

---

## Phase 11: テスト・ドキュメント整備

### テスト

- 全既存テストが新 API で動作すること
- 能力プロバイダの単体テスト追加
- SSR + Hydration のテスト更新
- 型テスト: 能力不足で mount がエラーになるケースの `@ts-expect-error` テスト

### ドキュメント

- `packages/core/README.md` — 能力インターフェース、mount API 変更
- `packages/base/README.md` — createDOMCapabilities 追加
- `packages/ssr/README.md` — SSR/Hydration 能力モデル
- `docs/PROJECT_KNOWLEDGE.md` — アーキテクチャ変遷の記録
- `experiments/` — PoC ファイルの整理

### Example 更新

全 showcase の mount 呼び出しを新 API に更新。

---

## 実行順序の依存関係グラフ

```
Phase 1 (能力 I/F)
    ↓
Phase 2 (Plugin/Mount 変更) ←─── Phase 3 (DOM 能力) と同時実行
    ↓                              ↓
Phase 4 (base 移行) ◄──────── Phase 3 完了後
    ↓
Phase 5 (core 内部)
    ↓
Phase 6 (他 plugin)
    ↓
Phase 7 (SSR 能力) ──→ Phase 8 (Hydration)
    ↓                       ↓
Phase 9 (RenderTarget 除去) ◄────┘
    ↓
Phase 10 (型効果追跡) — 独立して Phase 1 以降いつでも開始可能
    ↓
Phase 11 (整備)
```

### 最小切り替え単位 (Atomic Change Set)

Phase 2 + 3 + 4 + 5 が最小の原子的変更セット。これらは同時に適用しないとテストが通らない。

**推奨**: Phase 2-5 を 1 つの大きなコミットとして実行する。

Phase 6, 7, 8 はそれぞれ独立してコミット可能。

---

## リスクと対策

| リスク                                   | 影響                   | 対策                                                                   |
| ---------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| Phase 2-5 の同時変更量が大きい           | バグ混入               | 全テスト通過を逐次確認、git stash で退避可能に                         |
| 能力の optional/required の判断          | 型安全性 vs 使いやすさ | Phase 10 で型保証、移行期間は requireCapability() でランタイムチェック |
| Hydration の post-hydration 能力切り替え | 複雑さ                 | 全能力を最初から注入し、beforeRender だけスキップ                      |
| SSR で listener/lifecycle がクラッシュ   | ユーザー体験           | 明確なエラーメッセージ + Phase 10 で型レベル防止                       |
| Phase 10 の Plugin→Provided 型導出       | 型の複雑さ             | 追加 PoC で検証してから実装                                            |

---

## 見積もり

| Phase     | 規模感                                          |
| --------- | ----------------------------------------------- |
| Phase 1   | 小 — 型定義のみ                                 |
| Phase 2-5 | 大 — 原子的変更セット、core + base 全面書き換え |
| Phase 6   | 小 — mechanical な置換                          |
| Phase 7   | 中 — SSR 能力プロバイダ新規作成                 |
| Phase 8   | 中 — Hydration 再設計                           |
| Phase 9   | 小 — 削除のみ                                   |
| Phase 10  | 大 — 型レベル効果追跡の設計と実装               |
| Phase 11  | 中 — ドキュメント + テスト整備                  |
