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
