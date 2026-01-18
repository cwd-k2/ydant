# Ydant - Generator-based DOM Rendering DSL

## Overview

Ydant is a lightweight DOM rendering library using JavaScript generators as a DSL. It provides a declarative way to build UI components with dependency injection support via `inject`/`provide` pattern.

## Project Structure

```
ydant/
├── packages/
│   ├── core/          # DSL, types, component composition
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
@ydant/core   (DSL, types, composition)
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
type Text = Tagged<"text", { content: string }>;
type Element = Tagged<"element", { tag: string; holds: Children; extras?: Decoration[] }>;
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

Components are defined with `compose<Props>()`:

```typescript
interface DialogProps {
  title: string;
  onClose: () => void;
}

const Dialog = compose<DialogProps>(function* (inject) {
  // Receive props via inject
  const title = yield* inject("title");
  const onClose = yield* inject("onClose");

  // Return single root element
  return div(() => [
    clss(["dialog"]),
    h1(() => [text(title)]),
    button(() => [on("click", onClose), text("Close")]),
  ]);
});
```

Components are used with `provide`:

```typescript
yield* Dialog(function* (provide) {
  yield* provide("title", "Welcome");
  yield* provide("onClose", () => console.log("closed"));
  // Can also add decorations to root element
  yield* clss(["custom-class"]);
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

### App & Mount

The root component uses `Component<{}>` (aliased as `App`):

```typescript
import { compose, div, text } from "@ydant/core";
import { mount } from "@ydant/dom";

const Main = compose<{}>(function* () {
  return div(function* () {
    yield* text("Hello World");
  });
});

// Mount to DOM
mount(Main, document.getElementById("app")!);
```

## File Reference

### packages/core/src/

- `types.ts` - Core type definitions
  - `Tagged<T, P>` - Tagged union helper
  - `isTagged(value, tag)` - Unified type guard
  - `Attribute`, `Listener`, `Text` - Primitive types
  - `Decoration` - Attribute | Listener
  - `Child` - Element | Decoration | Text
  - `Children`, `ChildrenFn`, `ChildGen` - Child iteration types
  - `toChildren(result)` - Normalize array/iterator to Children
  - `Element` - HTML element with holds & extras
  - `ElementGenerator` - Generator yielding Elements
  - `Refresher` - Re-render callback
  - `Inject<K>`, `Provide<K,V>` - DI types
  - `InjectorFn<T>`, `ProviderFn<T>` - DI function types
  - `BuildFn<T>`, `RenderFn<T>` - Component function types
  - `Component<T>`, `App` - Component types
- `composer.ts` - `compose<T>()` function implementation
- `native.ts` - HTML element factories (div, span, p, button, etc.)
- `primitives.ts` - `attr()`, `clss()`, `on()`, `text()`
- `index.ts` - Re-exports everything

### packages/dom/src/index.ts

- `mount(app, parent)` - Mount App to DOM element
- `processElement()` - Render Element to HTMLElement
- `processIterator()` - Process child iterator

## Design Decisions

1. **Single-root components**: Each component returns exactly one Element
2. **extras field**: Decorations from usage site are merged into root element's `extras`
3. **render-first execution**: In `compose()`, the render phase (provide) runs before build phase (inject)
4. **Generator for Refresher**: Use generator syntax when you need the Refresher return value
5. **Array for static**: Use array syntax for static structures that don't need updates
6. **Two-package architecture**: `@ydant/core` provides DSL and types, `@ydant/dom` handles DOM rendering

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
import { type Refresher } from "@ydant/core";

const Main = compose<{}>(function* () {
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

  return div(function* () {
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
});
```

このパターンにより:
- イベントハンドラ登録時点で `refreshers` オブジェクトは存在する
- 実際の `Refresher` は後から格納されるが、クロージャで参照可能
- Optional chaining (`?.`) で安全に呼び出し可能

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
