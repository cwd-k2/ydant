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

| 型              | 用途                                                | 定義元            |
| --------------- | --------------------------------------------------- | ----------------- |
| `Render`        | コンポーネント関数の戻り値型                        | `@ydant/core`     |
| `ElementRender` | 要素ファクトリ (`div()` 等) の戻り値型              | `@ydant/base`     |
| `Primitive<T>`  | 副作用プリミティブ (`text()`, `on()` 等) の戻り値型 | `@ydant/core`     |
| `ChildContent`  | `children` プロパティに渡すビルダー関数の戻り値型   | `@ydant/core`     |
| `CleanupFn`     | ライフサイクル・副作用のクリーンアップ関数          | `@ydant/core`     |
| `Component<P>`  | コンポーネント型（Props なし / あり）               | `@ydant/core`     |
| `Readable<T>`   | 読み取り可能なリアクティブ値の共通インターフェース  | `@ydant/reactive` |

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

公開 API には JSDoc を付ける。特に:

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
  interface PluginChildExtensions {
    MyType: Tagged<"mytype", { ... }>;
  }

  interface RenderContextExtensions {
    myProperty: SomeType;
  }

  interface PluginAPIExtensions {
    myMethod(): void;
  }
}
```

### 拡張ポイント一覧

| インターフェース          | 用途                                       |
| ------------------------- | ------------------------------------------ |
| `PluginChildExtensions`   | `yield` できる Child 型を追加              |
| `PluginNextExtensions`    | `next()` で渡す値の型を追加                |
| `PluginReturnExtensions`  | return で返す値の型を追加                  |
| `RenderContextExtensions` | レンダリングコンテキストのプロパティを追加 |
| `PluginAPIExtensions`     | プラグイン API のメソッドを追加            |

### 型エイリアスの使い分け

```ts
// Render: コンポーネント全体の戻り値（汎用）
function MyComponent(): Render { ... }

// ElementRender: 要素ファクトリの戻り値（Slot を保証）
function div(builder: Builder): ElementRender { ... }

// Primitive<T>: プリミティブの戻り値（副作用のみ）
function text(content: string): Primitive<Text> { ... }
```

---

## プラグイン実装

### プラグインの構造

```ts
export function createMyPlugin(): Plugin {
  return {
    name: "my-plugin",
    types: ["mytype"],  // 処理する type の配列

    // コンテキスト初期化
    initContext(ctx: RenderContextCore & Partial<RenderContextExtensions>) {
      ctx.myProperty = initialValue;
    },

    // 子コンテキストのマージ
    mergeChildContext(parentCtx: RenderContext, childCtx: RenderContext) {
      // 必要に応じて親に情報を伝播
    },

    // API 拡張
    extendAPI(api: Partial<PluginAPIExtensions>, ctx: RenderContext) {
      api.myMethod = () => { ... };
    },

    // 子要素の処理
    process(child: Child, api: PluginAPI): PluginResult {
      if (isTagged(child, "mytype")) {
        return processMyType(child, api);
      }
      return {};
    },
  };
}
```

### PluginResult の形式

```ts
interface PluginResult {
  next?: ChildNext; // イテレータに渡す値
  return?: ChildReturn; // 早期終了時の戻り値
}
```

---

## プリミティブ実装

### ファクトリ関数パターン

```ts
// 汎用ファクトリ
function createPrimitive<T extends SomeChild, Args extends unknown[]>(
  factory: (...args: Args) => T,
) {
  return function* (...args: Args): Primitive<T> {
    yield factory(...args);
  };
}

// 使用
export const text = createPrimitive((content: string): Text => ({ type: "text", content }));
```

### 直接定義（複雑なロジックがある場合）

```ts
export function* style(properties: Partial<CSSStyleDeclaration>): Primitive<Attribute> {
  const styleValue = Object.entries(properties)
    .map(([k, v]) => `${toKebab(k)}: ${v}`)
    .join("; ");
  yield { type: "attribute", key: "style", value: styleValue };
}
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
  children: () => ChildContent;
}

export function Transition(props: TransitionProps): Render {
  return div(function* () {
    // 実装
  });
}
```

---

## テスト規約

### ファイル配置

- `__tests__/<module>.test.ts` に配置
- モジュール名と対応させる（`signal.ts` → `signal.test.ts`）

### 構造

```ts
import { describe, it, expect, vi } from "vitest";
import { signal } from "../signal";

describe("signal", () => {
  it("returns initial value", () => {
    const count = signal(0);
    expect(count()).toBe(0);
  });

  describe("set", () => {
    it("updates value with set()", () => {
      // ...
    });

    it("notifies subscribers on change", () => {
      // ...
    });
  });
});
```

### 命名規則

- `describe`: 対象の名前（関数名、メソッド名）
- `it`: 期待する振る舞いを説明（"returns ...", "updates ...", "does not ..."）

---

## import/export

### import の順序

```ts
// 1. 型インポート
import type { Tagged, CleanupFn } from "@ydant/core";
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
