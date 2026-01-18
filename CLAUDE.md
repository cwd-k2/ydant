# Ydant - Generator-based DOM Rendering DSL

## Overview

Ydant is a lightweight DOM rendering library using JavaScript generators as a DSL. It provides a declarative way to build UI components with simple function-based composition.

## Project Structure

```
ydant/
├── packages/
│   ├── core/          # DSL, types, element factories
│   └── dom/           # DOM rendering engine
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
@ydant/core   (DSL, types)
       ↑
@ydant/dom    (peer depends on core)
       ↑
showcase1     (depends on core & dom)
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
type Element = Tagged<"element", { tag: string; holds: Children; extras?: Decoration[]; ns?: string }>;
```

Use `isTagged(value, "tagname")` for type guards.

### Generator-based DSL

Two syntaxes are supported:

**Generator syntax** (when Refresher is needed):
```typescript
div(function* () {
  yield* clss(["container"]);
  const refresh = yield* p(function* () {
    yield* text("Hello");
  });
  // refresh can be used to re-render the <p> element
});
```

**Array syntax** (for static structures):
```typescript
div(() => [
  clss(["container"]),
  p(() => [text("Hello")]),
]);
```

### Component System

Components are simple functions that take props and return an `Component`:

```typescript
import { type Component } from "@ydant/core";

interface DialogProps {
  title: string;
  onClose: () => void;
}

function Dialog(props: DialogProps): Component {
  const { title, onClose } = props;

  return div(() => [
    clss(["dialog"]),
    h1(() => [text(title)]),
    button(() => [on("click", onClose), text("Close")]),
  ]);
}
```

Components are used by calling the function and yielding the result:

```typescript
yield* Dialog({
  title: "Welcome",
  onClose: () => console.log("closed"),
});
```

### Refresher

Elements return a `Refresher` function for re-rendering:

```typescript
let count = 0;
const refresh = yield* p(function* () {
  yield* text(`Count: ${count}`);
});

// Later, to update:
count++;
refresh(() => [text(`Count: ${count}`)]);
```

### Mount

The root component is a generator function that returns a `Component`:

```typescript
import { div, text, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";

function* Main(): Component {
  yield* div(function* () {
    yield* text("Hello World");
  });
  return (() => {}) as never;
}

// Mount to DOM
mount(Main(), document.getElementById("app")!);
```

## File Reference

### packages/core/src/

- `types.ts` - Core type definitions
  - `Tagged<T, P>` - Tagged union helper
  - `Attribute`, `Listener`, `Tap`, `Text` - Primitive types
  - `Decoration` - Attribute | Listener | Tap
  - `Child` - Element | Decoration | Text
  - `Children`, `ChildrenFn`, `ChildGen` - Child iteration types
  - `Element` - HTML element with holds, extras & ns (namespace for SVG)
  - `Component` - Generator yielding Elements
  - `Refresher` - Re-render callback
- `utils.ts` - Utility functions
  - `isTagged(value, tag)` - Unified type guard
  - `toChildren(result)` - Normalize array/iterator to Children
- `elements.ts` - HTML element factories (div, span, p, button, etc.) and SVG element factories (svg, circle, path, rect, etc.)
- `primitives.ts` - `attr()`, `clss()`, `on()`, `text()`, `tap()`
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
2. **Generator for Refresher**: Use generator syntax when you need the Refresher return value
3. **Array for static**: Use array syntax for static structures that don't need updates
4. **Two-package architecture**: `@ydant/core` provides DSL and types, `@ydant/dom` handles DOM rendering

## Development Notes

- Uses `@ydant/dev` custom condition for development (resolves to source `.ts` files)
- Production builds use `dist/` output
- Vite handles both dev server and production builds
- pnpm workspaces for monorepo management

## Implementation Patterns

### Refresher の正しい使い方

`Refresher` は引数として **コンテンツを返す関数** を必ず渡す必要がある。引数なしで呼び出すとエラーになる。

```typescript
// ❌ 間違い: 引数なしで呼び出し
refresh();

// ✅ 正しい: コンテンツを返す関数を渡す
refresh(() => [text(`Count: ${count}`)]);

// ✅ ジェネレーター関数も可
refresh(function* () {
  yield* clss(["updated"]);
  yield* text(`Count: ${count}`);
});
```

### イベントハンドラから Refresher を使うパターン

イベントハンドラ内から `Refresher` を呼び出す場合、変数のスコープに注意が必要。`yield*` で取得した `Refresher` はイベントハンドラ登録時点ではまだ定義されていない可能性がある。

**解決策: `refreshers` オブジェクトパターン**

```typescript
import { type Refresher, type Component } from "@ydant/core";

function* Main(): Component {
  // 1. Refresher を保持するオブジェクトを先に定義
  const refreshers: {
    list?: Refresher;
    stats?: Refresher;
  } = {};

  // 2. render 関数を定義（refreshers 経由でアクセス）
  const renderList = function* () {
    yield* clss(["list"]);
    for (const item of items) {
      yield* div(() => [text(item.name)]);
    }
  };

  const renderStats = function* () {
    yield* text(`Total: ${items.length}`);
  };

  yield* div(function* () {
    // 3. イベントハンドラでは refreshers 経由で呼び出し
    yield* button(function* () {
      yield* on("click", () => {
        items.push({ name: "New Item" });
        refreshers.list?.(renderList);
        refreshers.stats?.(renderStats);
      });
      yield* text("Add");
    });

    // 4. Refresher を取得して refreshers に格納
    refreshers.list = yield* div(renderList);
    refreshers.stats = yield* div(renderStats);
  });

  return (() => {}) as never;
}
```

このパターンにより:
- イベントハンドラ登録時点で `refreshers` オブジェクトは存在する
- 実際の `Refresher` は後から格納されるが、クロージャで参照可能
- Optional chaining (`?.`) で安全に呼び出し可能

### tap による DOM 要素への直接アクセス

`tap` は DOM 要素に直接アクセスするためのプリミティブ。`attr` や `on` では対応できない、要素固有のプロパティ操作が必要な場合に使用する。

```typescript
let inputElement: HTMLInputElement | null = null;

yield* input(function* () {
  yield* attr("type", "text");
  yield* tap<HTMLInputElement>((el) => {
    inputElement = el;  // DOM 要素への参照を取得
  });
  yield* on("input", (e) => { ... });
});

// 後で使用
if (inputElement) {
  inputElement.value = "";  // DOM プロパティを直接操作
}
```

**注意**: `tap` は DSL の抽象化を破るため、`attr`, `clss`, `on` で対応できない場合にのみ使用すること。

### SVG 要素の使い方

SVG 要素は専用のファクトリ関数で生成する。namespace が自動的に設定される。

```typescript
import { svg, circle, path, attr, clss } from "@ydant/core";

yield* svg(function* () {
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
  yield* path(() => [
    attr("d", "M10 10 L100 100"),
    attr("stroke", "black"),
  ]);
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

### memo.md について

`memo.md` はプロジェクトルートにある一時的なメモファイル。コミットしないこと。showcase のアイデアなど、検討中の内容が記載されている場合がある。
