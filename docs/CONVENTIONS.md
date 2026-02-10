# Ydant Conventions

Ydant プロジェクトにおける命名規則、型の使い分け、コーディングパターンを定義する。

## 命名規則

### 関数プレフィックス

- **`create*`**: 設定・構築を伴うオブジェクトの生成（Plugin, Context, SlotRef, Resource, etc.）
- **`get*`**: 現在の状態を取得する関数（getRoute など）
- **プレフィックスなし**: リアクティブプリミティブ（signal, computed, effect）
  — 他のリアクティビティライブラリとの慣習に合わせたもの

### PascalCase / lowercase

- **PascalCase**: `yield*` で使い、内部で DOM 構造を生成するコンポーネント
  （例: `Suspense`, `ErrorBoundary`, `Transition`, `RouterView`）
- **lowercase**: `yield*` で使うプリミティブ（単一の命令を発行）、および要素ファクトリ
  （例: `text`, `attr`, `on`, `classes`, `reactive`, `provide`, `inject`, `div`, `span`）

### ファイル命名

- **PascalCase**: コンポーネントファイル（`Transition.ts`, `RouterView.ts`）
- **lowercase**: その他のモジュール（`types.ts`, `utils.ts`, `plugin.ts`）

---

## 型の使い分け

| 型             | 用途                                                 | 定義元            |
| -------------- | ---------------------------------------------------- | ----------------- |
| `Spell<Key>`   | 個別 spell 操作の戻り値型（`Spell<"text">` 等）      | `@ydant/core`     |
| `Request`      | 全 spell 要求の union 型                             | `@ydant/core`     |
| `Response`     | `process()` の戻り値型（ジェネレーターへの応答）     | `@ydant/core`     |
| `Render`       | コンポーネント・要素ファクトリの汎用ジェネレーター型 | `@ydant/core`     |
| `Builder`      | 子要素のファクトリ関数 `() => Render \| Render[]`    | `@ydant/core`     |
| `Component<P>` | コンポーネント型（Props なし / あり）                | `@ydant/core`     |
| `Readable<T>`  | 読み取り可能なリアクティブ値の共通インターフェース   | `@ydant/reactive` |

---

## コンポーネント定義パターン

### Props なしコンポーネント

```ts
export function MyComponent(): Render {
  return div(function* () {
    yield* text("Hello");
  });
}
```

### Props ありコンポーネント

```ts
export const MyComponent: Component<Props> = (props) => {
  return div(function* () {
    yield* text(props.message);
  });
};
```

### ジェネレーター構文（推奨）

要素内の子要素はジェネレーター構文を推奨:

```ts
div(function* () {
  yield* text("hello");
  yield* classes("foo");
});
```

### 配列構文

単純な静的コンテンツの場合は許容:

```ts
div(() => [classes("border"), text("simple")]);
```

### Props の命名: `children` vs `content`

- **`children`**: DOM 要素の実際の子要素に使う（`RouterLink.children`, `Element.children`, `Slot.refresh(children)`）
- **`content`**: 抽象的な描画関数を受け取る Props に使う（`Suspense.content`, `ErrorBoundary.content`, `Transition.content`, `TransitionGroup.content`）

```ts
// ✅ children: <a> 要素の DOM 子要素
interface RouterLinkProps {
  href: string;
  children: () => Render;
}

// ✅ content: 抽象的な描画関数
interface SuspenseProps {
  fallback: () => Render;
  content: () => Render;
}
```

---

## index.ts の構造

パッケージの index.ts は以下のセクションコメントで構造化する:

```ts
// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

// ─── Types ───
export type { ... };

// ─── Runtime ───
export { ... };

// ─── Plugin ───
export { create*Plugin };
```

---

## JSDoc

公開 API には JSDoc を付ける。**英語** で記述する（DOCUMENTATION.md「言語ポリシー」参照）。

- 関数: `@param`, `@returns`, `@example`
- インターフェース: 各プロパティに説明
- 型エイリアス: 用途の説明

---

## ファイル構成

### パッケージ内のファイル配置

```
packages/<name>/src/
├── index.ts          # 公開 API エクスポート（必須）
├── types.ts          # 型定義
├── plugin.ts         # プラグイン実装（create*Plugin）
├── global.d.ts       # module augmentation（core 拡張時）
├── __tests__/        # テストディレクトリ
│   └── *.test.ts
└── <feature>.ts      # 機能別モジュール
```

### サブディレクトリの使用

関連ファイルが3つ以上ある場合、サブディレクトリにまとめる:

```
packages/base/src/
├── elements/
│   ├── factory.ts    # 共通ファクトリ
│   ├── html.ts       # HTML 要素
│   └── svg.ts        # SVG 要素
└── plugin/
    ├── index.ts      # プラグイン本体
    ├── element.ts    # 要素処理
    └── primitives.ts # プリミティブ処理
```

---

## 型システム

### Tagged Union パターン

識別可能な Union 型には `Tagged<T, P>` を使用:

```ts
// 定義
export type Tagged<T extends string, P = {}> = { type: T } & P;

// 使用例
export type Attribute = Tagged<"attribute", { key: string; value: string }>;
export type Text = Tagged<"text", { content: string }>;
```

### インターフェース拡張（Module Augmentation）

プラグインが core の型を拡張する場合、`global.d.ts` で `declare module` を使用:

```ts
// packages/<name>/src/global.d.ts
declare module "@ydant/core" {
  interface SpellSchema {
    mytype: { request: Tagged<"mytype", { ... }> };
  }

  interface RenderContext {
    myProperty: SomeType;
  }
}
```

### 拡張ポイント一覧

| インターフェース | 用途                                                 |
| ---------------- | ---------------------------------------------------- |
| `SpellSchema`    | spell 操作定義（request/response/return）            |
| `RenderContext`  | レンダリングコンテキストのプロパティ・メソッドを追加 |

### 型エイリアスの使い分け

```ts
// Render: コンポーネント・要素の戻り値（汎用）
function MyComponent(): Render { ... }

// Spell<Key>: 個別 spell 操作の戻り値（操作ごとに型付け）
function text(content: string): Spell<"text"> { ... }
function div(builder: Builder): Spell<"element"> { ... }
```

---

## プラグイン実装

### プラグインの構造

```ts
export function createMyPlugin(): Plugin {
  return {
    name: "my-plugin",
    types: ["mytype"], // 処理する type の配列

    // コンテキスト初期化
    initContext(ctx: RenderContext) {
      ctx.myProperty = initialValue;
    },

    // 子コンテキストのマージ
    mergeChildContext(parentCtx: RenderContext, childCtx: RenderContext) {
      // 必要に応じて親に情報を伝播
    },

    // Request の処理（ctx のプロパティに直接アクセス）
    process(request: Request, ctx: RenderContext): Response {
      if (isTagged(request, "mytype")) {
        return processMyType(request, ctx);
      }
    },
  };
}
```

---

## プリミティブ実装

### 基本パターン

プリミティブは `Spell<Key>` を返すジェネレーター関数として定義する:

```ts
export function* text(content: string): Spell<"text"> {
  yield { type: "text", content };
}

export function* style(properties: Partial<CSSStyleDeclaration>): Spell<"attribute"> {
  const styleValue = Object.entries(properties)
    .map(([k, v]) => `${toKebab(k)}: ${v}`)
    .join("; ");
  yield { type: "attribute", key: "style", value: styleValue };
}
```

### ジェネレーターインターセプトパターン（keyed）

要素ファクトリやコンポーネントが yield する値を加工したい場合、
ジェネレーターの最初の yield をインターセプトするラッパー関数を作る:

```ts
// keyed() は factory の生成する Element に key を付与する
export function keyed<Args extends unknown[]>(
  key: string | number,
  factory: (...args: Args) => Render,
): (...args: Args) => ElementRender {
  return (...args: Args) => {
    return (function* (): ElementRender {
      const inner = factory(...args) as ElementRender;
      const first = inner.next();
      if (first.done) return first.value;
      const element = first.value;
      const slot = (yield { ...element, key }) as Slot;
      inner.next(slot);
      return slot;
    })() as ElementRender;
  };
}
```

ポイント:

- **`<Args extends unknown[]>`** で引数をジェネリック化し、要素ファクトリ `(builder: Builder) => ...` もコンポーネント `(props: P) => ...` も同一 API で扱える
- factory が `Render` を返す宣言でも `ElementRender` を返す宣言でも受け付ける（`ElementRender extends Render`）
- ジェネレーターの `next()` でインターセプトし、yield される値を加工してから親に再 yield する

使用例:

```ts
// 要素ファクトリと組み合わせ
yield * keyed(item.id, li)(() => [text(item.name)]);

// コンポーネントと組み合わせ
yield * keyed(item.id, ListItemView)({ item, onDelete });

// 関数と組み合わせ（TransitionGroup 内の content など）
yield * keyed(itemKey, content)(item, i);
```

---

## コンポーネント実装（PascalCase）

内部構造を持つコンポーネントは Props インターフェースを定義:

```ts
export interface TransitionProps {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  content: () => Render;
}

export function Transition(props: TransitionProps): Render {
  return div(function* () {
    // 実装
  });
}
```

---

## テスト規約

テストの方針・書き方・避けるべきパターンは **[docs/TESTING.md](TESTING.md)** を参照。

ファイル配置のみここに記載:

- `__tests__/<module>.test.ts` に配置
- モジュール名と対応させる（`signal.ts` → `signal.test.ts`）

---

## import/export

### import の順序

```ts
// 1. 型インポート
import type { Request, Response } from "@ydant/core";
import type { Slot, Element } from "@ydant/base";

// 2. 外部パッケージ
import "@ydant/base"; // side effect import

// 3. 内部モジュール
import { isTagged } from "@ydant/core";
import { processElement } from "./element";
```

### export パターン

```ts
// 型は type export
export type { Signal } from "./signal";

// 値は通常の export
export { signal } from "./signal";

// プラグインは create* 関数
export { createReactivePlugin } from "./plugin";
```

---

## エラーハンドリング

- 外部入力（ユーザー入力、API レスポンス）のみバリデーション
- 内部関数間では型を信頼し、過剰なチェックを避ける
- プラグインの `process` は未知の型を静かにスキップ（`return {}`）

---

## 開発時の型解決（customConditions）

### 背景

monorepo でパッケージを変更したとき、ビルドせずに `pnpm typecheck` で変更を反映させたい。
TypeScript 5.0+ の `customConditions` と `moduleResolution: "bundler"` を使用してこれを実現する。

### 設定

**tsconfig.json（ルート）:**

```json
{
  "compilerOptions": {
    "customConditions": ["@ydant/dev"],
    "moduleResolution": "bundler"
  }
}
```

**package.json（各パッケージ）:**

```json
{
  "exports": {
    ".": {
      "@ydant/dev": {
        "types": "./src/index.ts",
        "default": "./src/index.ts"
      },
      "types": "./dist/index.d.ts",
      "import": "./dist/index.es.js",
      "require": "./dist/index.umd.js"
    }
  }
}
```

### 重要: exports のネスト構造

TypeScript は `types` 条件を特別扱いし、他の条件より優先的にマッチする。
そのため、カスタム条件は**ネスト構造**にして、その中に `types` を定義する必要がある。

```json
// ❌ NG: types がカスタム条件より先にマッチしてしまう
{
  "types": "./dist/index.d.ts",
  "@ydant/dev": "./src/index.ts"
}

// ✅ OK: カスタム条件がマッチしたら、その中の types を使う
{
  "@ydant/dev": {
    "types": "./src/index.ts",
    "default": "./src/index.ts"
  },
  "types": "./dist/index.d.ts"
}
```

### module augmentation の考慮

`global.d.ts` で `declare module` を使用するパッケージでは、
`src/index.ts` の先頭に triple-slash reference を追加する:

```ts
/// <reference path="./global.d.ts" />
/**
 * @ydant/package-name
 * ...
 */
```

ビルド時は vite が `dist/index.d.ts` に同様の reference を追加するため、
開発時・本番時どちらでも module augmentation が正しく読み込まれる。
