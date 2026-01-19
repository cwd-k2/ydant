# Ydant - Generator-based DOM Rendering DSL

## Overview

Ydant is a lightweight DOM rendering library using JavaScript generators as a DSL. It provides a declarative way to build UI components with simple function-based composition.

## Project Structure

```
ydant/
├── packages/
│   ├── core/          # DSL, types, element factories
│   ├── dom/           # DOM rendering engine
│   └── reactive/      # Reactivity system (signal, computed, effect)
├── examples/
│   ├── showcase1/     # Demo: Counter, Dialog component
│   ├── showcase2/     # Demo: ToDo App (CRUD, localStorage)
│   └── showcase3/     # Demo: Pomodoro Timer
├── package.json       # Root workspace config
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Package Dependencies

```
@ydant/core     (DSL, types)
       ↑
@ydant/reactive (peer depends on core)
       ↑
@ydant/dom      (peer depends on core, optional peer depends on reactive)
       ↑
showcase1       (depends on core & dom)
```

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run showcase1 dev server
cd examples/showcase1 && pnpm run dev

# Type check (in any package or example)
pnpm tsc --noEmit
```

## Core Concepts

### Tagged Union Types

All types use a tagged union pattern with `type` discriminator:

```typescript
type Tagged<T extends string, P = {}> = { type: T } & P;

// Examples
type Attribute = Tagged<"attribute", { key: string; value: string }>;
type Listener = Tagged<"listener", { key: string; value: (e: Event) => void }>;
type Tap = Tagged<"tap", { callback: (el: HTMLElement) => void }>;
type Text = Tagged<"text", { content: string }>;
type Element = Tagged<
  "element",
  { tag: string; holds: Children; extras?: Decoration[]; ns?: string }
>;
```

Use `isTagged(value, "tagname")` for type guards.

### Generator-based DSL

Two syntaxes are supported:

**Generator syntax** (when Slot is needed):

```typescript
div(function* () {
  yield* clss(["container"]);
  const slot = yield* p(function* () {
    yield* text("Hello");
  });
  // slot.refresh() can be used to re-render the <p> element
  // slot.node gives direct access to the DOM element
});
```

**Array syntax** (for static structures):

```typescript
div(() => [clss(["container"]), p(() => [text("Hello")])]);
```

### Component System

**ルートコンポーネント** は `Component` 型（`() => ElementGenerator`）として定義する:

```typescript
import { type Component } from "@ydant/core";

const Main: Component = () =>
  div(function* () {
    yield* h1(() => [text("Hello World")]);
  });
```

**props を受け取るコンポーネント** は通常の関数として定義（返り値の型注釈は不要）:

```typescript
interface DialogProps {
  title: string;
  onClose: () => void;
}

function Dialog(props: DialogProps) {
  const { title, onClose } = props;

  return div(() => [
    clss(["dialog"]),
    h1(() => [text(title)]),
    button(() => [on("click", onClose), text("Close")]),
  ]);
}
```

コンポーネントは呼び出して結果を yield:

```typescript
yield *
  Dialog({
    title: "Welcome",
    onClose: () => console.log("closed"),
  });
```

### Slot

Elements return a `Slot` object for re-rendering and DOM access:

```typescript
interface Slot {
  readonly node: HTMLElement;  // DOM 要素への直接参照
  refresh(children: ChildrenFn): void;  // 子要素を再レンダリング
}
```

**使用例:**

```typescript
let count = 0;
const { refresh, node } = yield* p(function* () {
  yield* text(`Count: ${count}`);
});

// 更新
count++;
refresh(() => [text(`Count: ${count}`)]);

// DOM 要素への直接アクセス（tap 不要）
(node as HTMLInputElement).focus();
node.scrollIntoView();
```

**分割代入で必要なものだけ取得:**

```typescript
const { refresh } = yield* div(renderContent);  // node 不要
const { node } = yield* div(renderContent);     // refresh 不要
const slot = yield* div(renderContent);         // 両方必要
```

### Mount

ルートコンポーネントは `Component` 型として定義し、`mount` に渡す:

```typescript
import { div, text, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";

const Main: Component = () =>
  div(function* () {
    yield* text("Hello World");
  });

// Mount to DOM
mount(Main, document.getElementById("app")!);
```

## File Reference

### packages/core/src/

- `types.ts` - Core type definitions
  - `Tagged<T, P>` - Tagged union helper
  - `Attribute`, `Listener`, `Tap`, `Text` - Primitive types
  - `Lifecycle` - ライフサイクルイベント（mount/unmount）
  - `Style` - インラインスタイル
  - `Key` - リスト要素の一意な識別子（差分更新用）
  - `Reactive` - リアクティブブロック（Signal 追跡用）
  - `Decoration` - Attribute | Listener | Tap
  - `Child` - Element | Decoration | Text | Lifecycle | Style | Key | Reactive
  - `Children`, `ChildrenFn`, `ChildGen` - Child iteration types
  - `Element` - HTML element with holds, extras & ns (namespace for SVG)
  - `Slot` - DOM 要素参照と再レンダリング関数を持つオブジェクト
  - `ElementGenerator` - Generator yielding Elements, returning Slot
  - `Component` - `() => ElementGenerator` (ルートコンポーネント用)
- `utils.ts` - Utility functions
  - `isTagged(value, tag)` - Unified type guard
  - `toChildren(result)` - Normalize array/iterator to Children
- `elements.ts` - HTML element factories (div, span, p, button, etc.) and SVG element factories (svg, circle, path, rect, etc.)
- `primitives.ts` - `attr()`, `clss()`, `on()`, `text()`, `tap()`, `onMount()`, `onUnmount()`, `style()`, `key()`
- `helpers.ts` - `show()`, `each()` ヘルパー関数
- `index.ts` - Re-exports everything

### packages/reactive/src/

- `signal.ts` - Signal 実装（リアクティブな値コンテナ）
- `computed.ts` - Computed 実装（派生値）
- `effect.ts` - Effect 実装（副作用）
- `reactive.ts` - reactive プリミティブ（Signal 追跡と自動更新）
- `index.ts` - Re-exports everything

### packages/dom/src/index.ts

- `mount(app, parent)` - Mount Component to DOM element
- `processElement()` - Render Element to HTMLElement
- `processIterator()` - Process child iterator

### examples/showcase2/src/ (ToDo App)

```
src/
├── types.ts           # Todo, Filter 型定義
├── storage.ts         # localStorage ヘルパー
├── components/
│   ├── TodoItem.ts    # Todo アイテムコンポーネント
│   └── FilterButton.ts
├── App.ts             # メインコンポーネント
└── index.ts           # エントリーポイント (mount)
```

### examples/showcase3/src/ (Pomodoro Timer)

```
src/
├── types.ts           # TimerMode, TimerState 型定義
├── constants.ts       # DURATIONS, MODE_LABELS, MODE_COLORS
├── utils.ts           # formatTime
├── components/
│   └── ModeButton.ts
├── App.ts             # メインコンポーネント (SVG プログレスリングを DSL で構築)
└── index.ts           # エントリーポイント (mount)
```

## Design Decisions

1. **Simple function components**: Components are plain functions that take props and return Component
2. **Generator for Slot**: Use generator syntax when you need the Slot return value (for re-rendering or DOM access)
3. **Array for static**: Use array syntax for static structures that don't need updates
4. **Three-package architecture**: `@ydant/core` provides DSL and types, `@ydant/reactive` provides reactivity, `@ydant/dom` handles DOM rendering
5. **Lifecycle hooks**: `onMount`/`onUnmount` for resource cleanup (e.g., timers, subscriptions)
6. **Signal-based reactivity**: Explicit reading with `signal()` call, similar to SolidJS/Preact Signals
7. **Key-based diff**: `key` primitive enables efficient list updates by reusing DOM nodes

## Development Notes

- Uses `@ydant/dev` custom condition for development (resolves to source `.ts` files)
- Production builds use `dist/` output
- Vite handles both dev server and production builds
- pnpm workspaces for monorepo management

## Implementation Patterns

### Slot.refresh() の正しい使い方

`Slot.refresh()` は引数として **コンテンツを返す関数** を必ず渡す必要がある。引数なしで呼び出すとエラーになる。

```typescript
// ❌ 間違い: 引数なしで呼び出し
slot.refresh();

// ✅ 正しい: コンテンツを返す関数を渡す
slot.refresh(() => [text(`Count: ${count}`)]);

// ✅ ジェネレーター関数も可
slot.refresh(function* () {
  yield* clss(["updated"]);
  yield* text(`Count: ${count}`);
});
```

### イベントハンドラから Slot を使うパターン

イベントハンドラ内から `Slot.refresh()` を呼び出す場合、変数のスコープに注意が必要。`yield*` で取得した `Slot` はイベントハンドラ登録時点ではまだ定義されていない可能性がある。

**解決策: Slot 変数を先に宣言**

```typescript
import { type Slot, type Component } from "@ydant/core";

const Main: Component = () => {
  // 1. Slot 変数を先に宣言
  let listSlot: Slot;
  let statsSlot: Slot;

  // 2. render 関数を定義
  const renderList = function* () {
    yield* clss(["list"]);
    for (const item of items) {
      yield* div(() => [text(item.name)]);
    }
  };

  const renderStats = function* () {
    yield* text(`Total: ${items.length}`);
  };

  return div(function* () {
    // 3. イベントハンドラでは Slot 経由で呼び出し
    yield* button(function* () {
      yield* on("click", () => {
        items.push({ name: "New Item" });
        listSlot.refresh(renderList);
        statsSlot.refresh(renderStats);
      });
      yield* text("Add");
    });

    // 4. Slot を取得して変数に格納
    listSlot = yield* div(renderList);
    statsSlot = yield* div(renderStats);
  });
};
```

このパターンにより:

- イベントハンドラ登録時点で Slot 変数は存在する（クロージャで参照可能）
- 実際の Slot は後から代入される
- Optional chaining 不要（変数は必ず代入されることが保証）

### ライフサイクルフック（onMount / onUnmount）

`onMount` と `onUnmount` は、コンポーネントのマウント/アンマウント時に処理を実行するためのプリミティブ。タイマー、イベントリスナー、購読などのリソースクリーンアップに使用する。

```typescript
import { onMount, onUnmount, type Component } from "@ydant/core";

const Timer: Component = () => {
  let interval: ReturnType<typeof setInterval> | null = null;

  return div(function* () {
    // パターン1: onMount のコールバックがクリーンアップ関数を返す
    yield* onMount(() => {
      interval = setInterval(() => console.log("tick"), 1000);

      // クリーンアップ関数を返す（アンマウント時に実行される）
      return () => {
        if (interval) clearInterval(interval);
      };
    });

    // パターン2: onMount と onUnmount を分離して書く
    yield* onMount(() => {
      console.log("Component mounted");
    });

    yield* onUnmount(() => {
      console.log("Component unmounted");
    });

    yield* text("Timer content");
  });
};
```

**重要**: `onMount` のコールバックは DOM 更新完了後（`requestAnimationFrame` のタイミング）に実行される。`onUnmount` のコールバックは `Slot.refresh()` 呼び出し時に、DOM クリア前に実行される。

### tap による DOM 要素への直接アクセス

`tap` は DOM 要素に直接アクセスするためのプリミティブ。`attr` や `on` では対応できない、要素固有のプロパティ操作が必要な場合に使用する。

**注意**: `Slot.node` を使えば `tap` なしでも DOM 要素にアクセスできる。`tap` は Slot を取得しない場合（配列構文など）に使用する。

```typescript
// 方法1: Slot.node を使用（推奨）
const { node } = yield* input(function* () {
  yield* attr("type", "text");
  yield* on("input", (e) => { ... });
});
(node as HTMLInputElement).value = "";

// 方法2: tap を使用（Slot を取得しない場合）
let inputElement: HTMLInputElement | null = null;

yield* input(function* () {
  yield* attr("type", "text");
  yield* tap<HTMLInputElement>((el) => {
    inputElement = el;  // DOM 要素への参照を取得
  });
  yield* on("input", (e) => { ... });
});

if (inputElement) {
  inputElement.value = "";
}
```

**注意**: `tap` は DSL の抽象化を破るため、`attr`, `clss`, `on`, `Slot.node` で対応できない場合にのみ使用すること。

### ヘルパー関数（show, each）

条件分岐やリストレンダリングを簡潔に書くためのヘルパー関数。

**show: 条件分岐**

```typescript
import { show } from "@ydant/core";

// 条件が真の時だけ表示
yield* show(isLoggedIn, () => UserProfile({ user }));

// else 付き
yield* show(
  isLoggedIn,
  () => UserProfile({ user }),
  () => LoginButton()
);
```

**each: リストレンダリング**

```typescript
import { each } from "@ydant/core";

yield* ul(function* () {
  yield* each(todos, {
    key: (todo) => todo.id,  // 一意なキー（差分更新に使用）
    render: (todo, index) => li(() => [
      text(`${index + 1}. ${todo.text}`),
    ]),
    empty: () => p(() => [text("No todos yet")]),  // 空の場合
  });
});
```

### style プリミティブ

型安全なインラインスタイルを設定するプリミティブ。CSS 変数もサポート。

```typescript
import { style } from "@ydant/core";

yield* div(function* () {
  yield* style({
    padding: "16px",
    display: "flex",
    gap: "8px",
    "--primary-color": "#3b82f6",  // CSS 変数
    backgroundColor: "var(--primary-color)",
  });
  yield* text("Styled content");
});
```

### key による差分更新

リスト要素に一意なキーを設定することで、`Slot.refresh()` 時の DOM 更新を最適化できる。

```typescript
import { key } from "@ydant/core";

// キーを設定することで、同じキーを持つ要素は DOM ノードが再利用される
for (const item of items) {
  yield* key(item.id);  // 次の要素にキーを関連付け
  yield* li(() => [text(item.name)]);
}

// または each ヘルパーを使用（key は自動設定される）
yield* each(items, {
  key: (item) => item.id,
  render: (item) => li(() => [text(item.name)]),
});
```

**利点:**
- DOM ノードの再利用による パフォーマンス向上
- input のフォーカスやスクロール位置の保持
- アニメーションの継続

### リアクティビティシステム（@ydant/reactive）

Signal ベースのリアクティビティシステム。SolidJS / Preact Signals に影響を受けた設計。

**基本的な使い方:**

```typescript
import { signal, computed, effect } from "@ydant/reactive";

// Signal: 値を保持するリアクティブコンテナ
const count = signal(0);
console.log(count());  // 読み取り: 0
count.set(5);          // 書き込み
count.update(n => n + 1);  // 関数で更新

// Computed: 派生値（依存する Signal が変わると自動再計算）
const doubled = computed(() => count() * 2);
console.log(doubled());  // 12

// Effect: 副作用（依存する Signal が変わると自動再実行）
const dispose = effect(() => {
  console.log(`Count: ${count()}, Doubled: ${doubled()}`);
});
// 出力: "Count: 6, Doubled: 12"

count.set(10);
// 出力: "Count: 10, Doubled: 20"

dispose();  // 購読解除
```

**reactive プリミティブで自動更新:**

```typescript
import { signal, computed } from "@ydant/reactive";
import { reactive } from "@ydant/reactive";

const count = signal(0);
const doubled = computed(() => count() * 2);

const Counter: Component = () =>
  div(function* () {
    // reactive 内の Signal アクセスを自動追跡
    // Signal が変わると自動で再レンダリング
    yield* reactive(() => [
      text(`Count: ${count()}, Doubled: ${doubled()}`),
    ]);

    yield* button(() => [
      on("click", () => count.update(n => n + 1)),
      text("Increment"),
    ]);
  });
```

**手動更新との共存:**

```typescript
// リアクティブ更新と手動 Slot.refresh() は共存可能
yield* reactive(() => [text(`Auto: ${autoCount()}`)]);

const { refresh } = yield* div(() => [text(`Manual: ${manualCount}`)]);
manualCount++;
refresh(() => [text(`Manual: ${manualCount}`)]);
```

### SVG 要素の使い方

SVG 要素は専用のファクトリ関数で生成する。namespace が自動的に設定される。

```typescript
import { svg, circle, path, attr, clss } from "@ydant/core";

yield *
  svg(function* () {
    yield* attr("width", "240");
    yield* attr("height", "240");
    yield* clss(["my-svg"]);

    // 背景の円
    yield* circle(() => [
      attr("cx", "120"),
      attr("cy", "120"),
      attr("r", "100"),
      attr("fill", "none"),
      attr("stroke", "#e5e7eb"),
      attr("stroke-width", "8"),
    ]);

    // パス
    yield* path(() => [attr("d", "M10 10 L100 100"), attr("stroke", "black")]);
  });
```

**利用可能な SVG 要素**: `svg`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`, `g`, `defs`, `use`, `clipPath`, `mask`, `linearGradient`, `radialGradient`, `stop`, `svgText`, `tspan`

**注意**: SVG の `<text>` 要素は `svgText` として提供（`text` プリミティブとの名前衝突を回避）。

### 新しい showcase の追加方法

1. `examples/showcaseN/` ディレクトリを作成
2. 以下のファイルを showcase1 からコピーして修正:
   - `package.json` - name を変更、dependencies に `@ydant/core` と `@ydant/dom`
   - `tsconfig.json` - そのまま使用可能
   - `vite.config.ts` - そのまま使用可能
   - `index.html` - タイトルとスタイルを調整
   - `src/index.ts` - メインロジックを実装
3. ルートで `pnpm install` を実行
4. `cd examples/showcaseN && pnpm run dev` で起動確認

## For Future Contributors

### タスク完了時の知見記録について

**実装タスクを完了した際は、以下の知見を CLAUDE.md に追記すること:**

1. **つまずいたポイント**: 実装中に遭遇したエラーや問題
2. **解決パターン**: 問題をどのように解決したか
3. **新しい発見**: ドキュメントに記載されていなかった挙動や制約
4. **推奨パターン**: 今後の実装で使うべきパターン

この知見の収集・記載は **タスクの一部** である。次の担当者がスムーズに作業できるよう、学んだことを必ず残すこと。

---

## Documentation Philosophy

### ストック情報とフロー情報

このプロジェクトでは、ドキュメントを **ストック情報** と **フロー情報** に区別して管理する。

#### ストック情報（コミット対象）

**CLAUDE.md** がストック情報の唯一の正式なドキュメントである。

- プロジェクトの概要、構造、コマンド
- 確定した設計決定
- 実装パターンとベストプラクティス
- 将来の担当者が必要とする知識

**特性:**

- 常に最新の状態を反映
- 自己完結している（他のドキュメントを参照しなくても理解できる）
- 事実のみを記載（検討中の内容は含まない）

#### フロー情報（コミット対象外）

以下のファイルはフロー情報であり、**コミットしないこと**:

| ファイル                 | 目的                                 |
| ------------------------ | ------------------------------------ |
| `MEMO.md`                | 一時的な検討メモ、アイデアの記録     |
| `FEATURE-PLAN.md`        | 検討中の機能案、設計オプションの比較 |
| `IMPLEMENTATION-PLAN.md` | 実装作業中の詳細計画                 |

**特性:**

- 作業中の状態を記録
- 検討中・未確定の内容を含む
- 作業完了後に CLAUDE.md へ知見を反映し、削除または更新する

### ドキュメントの自己完結性

**各ドキュメントは自己完結していなければならない。**

以下は **禁止** される記述:

- 「前回の内容を維持」
- 「上記を参照」（同一ドキュメント内の明確な参照は可）
- 「別ファイルを見てください」（代わりに内容を転記するか、要約を記載）

**理由:**

- ドキュメントを読む人は、そのファイルだけで内容を理解できるべき
- 参照先が削除・変更されると意味不明になる
- 検索で該当ファイルにたどり着いた人が迷わない

### 知見の反映フロー

```
作業開始
    ↓
MEMO.md / FEATURE-PLAN.md / IMPLEMENTATION-PLAN.md で検討・計画
    ↓
実装作業
    ↓
作業完了
    ↓
確定した知見を CLAUDE.md に反映
    ↓
フロー情報ファイルを削除または次のタスク用に更新
```

### .gitignore への追加

以下のファイルが `.gitignore` に含まれていることを確認すること:

```
MEMO.md
FEATURE-PLAN.md
IMPLEMENTATION-PLAN.md
```
