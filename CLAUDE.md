# Ydant Development Guide

## What is Ydant?

JavaScript ジェネレーターを DSL として使用する DOM レンダリングライブラリ。

## Architecture

### 設計哲学

Ydant は **core** と **base** の明確な分離を設計の中心に置いている。

**@ydant/core** は「何をレンダリングするか」を知らない純粋な基幹システム。
ジェネレーターの処理、プラグインの呼び出し、コンテキストの管理のみを行う。
DOM の存在すら仮定せず、プラグインが全ての具体的な処理を担う。

**@ydant/base** は「どのようにレンダリングするか」を知る利用者向け基本 API。
要素ファクトリ、プリミティブ、lifecycle、DOM 操作を提供する。
ユーザーが直接触れる API の大部分はここで定義される。

この分離により:

- core は安定した小さな API surface を維持できる
- base は core を変更せずに機能追加・変更できる
- 他のプラグインは base と同じ立場で機能を追加できる

### パッケージ構成

**基盤:**

- `@ydant/core` - 処理系、プラグインシステム、mount()
- `@ydant/base` - 要素ファクトリ、プリミティブ、Slot、ベースプラグイン

**拡張（プラグイン）:**

- `@ydant/reactive` - Signal ベースのリアクティビティ
- `@ydant/context` - Context API、永続化

**追加 DSL:**

- `@ydant/router` - SPA ルーティング
- `@ydant/async` - Suspense、ErrorBoundary
- `@ydant/transition` - CSS トランジション

プラグインは `mount()` 時に登録し、DSL は `yield*` で使用する。
`createBasePlugin()` は要素やプリミティブを処理するために必須。

## Commands

```bash
pnpm install              # 依存関係インストール
pnpm -r run build         # 全パッケージビルド
pnpm run dev              # 統合 dev サーバー
pnpm test                 # テスト（watch）
pnpm test:run             # テスト（単発）
pnpm test:coverage        # カバレッジ付きテスト
pnpm lint                 # リント実行
pnpm lint:fix             # リント + 自動修正
pnpm format               # フォーマット適用
pnpm format:check         # フォーマットチェック
pnpm typecheck            # 型チェック
```

---

## Documentation Structure

| ファイル                     | 内容                                       |
| ---------------------------- | ------------------------------------------ |
| `README.md` / `README.ja.md` | プロジェクト概要、API 一覧（**常に同期**） |
| `packages/*/README.md`       | 各パッケージの詳細 API                     |
| `examples/*/README.md`       | 各 showcase の実装パターン・ヒント         |
| `CLAUDE.md`                  | 開発ガイド（このファイル）                 |

### 原則

1. **README 同期**: 日英 README は内容を一致させる
2. **CLAUDE.md は簡潔に**: 詳細は適切な場所（パッケージ/showcase README）に委ねる
3. **情報の重複を避ける**: 同じ情報を複数箇所に書かない

### 情報の配置

| 情報                         | 配置先                       |
| ---------------------------- | ---------------------------- |
| API 仕様、型定義             | `packages/*/README.md`       |
| 使用例、機能一覧             | `README.md` / `README.ja.md` |
| 実装パターン、躓きポイント   | `examples/*/README.md`       |
| アーキテクチャ、開発コマンド | `CLAUDE.md`                  |

---

## Conventions

### 命名規則

- **`create*`**: 設定・構築を伴うオブジェクトの生成（Plugin, Context, SlotRef, Resource, etc.）
- **プレフィックスなし**: リアクティブプリミティブ（signal, computed, effect）
  — 他のリアクティビティライブラリとの慣習に合わせたもの

### PascalCase / lowercase

- **PascalCase**: `yield*` で使い、内部で DOM 構造を生成するコンポーネント
  （例: `Suspense`, `ErrorBoundary`, `Transition`, `RouterView`）
- **lowercase**: `yield*` で使うプリミティブ（単一の命令を発行）、および要素ファクトリ
  （例: `text`, `attr`, `on`, `classes`, `reactive`, `provide`, `inject`, `div`, `span`）

### 型の使い分け

| 型              | 用途                                                | 定義元        |
| --------------- | --------------------------------------------------- | ------------- |
| `Render`        | コンポーネント関数の戻り値型                        | `@ydant/core` |
| `ElementRender` | 要素ファクトリ (`div()` 等) の戻り値型              | `@ydant/base` |
| `Primitive<T>`  | 副作用プリミティブ (`text()`, `on()` 等) の戻り値型 | `@ydant/core` |
| `ChildContent`  | `children` プロパティに渡すビルダー関数の戻り値型   | `@ydant/core` |
| `CleanupFn`     | ライフサイクル・副作用のクリーンアップ関数          | `@ydant/core` |
| `Component<P>`  | コンポーネント型（Props なし / あり）               | `@ydant/core` |

### コンポーネント定義の推奨パターン

```ts
// Props なしコンポーネント
export function MyComponent(): Render {
  return div(function* () { ... });
}

// Props ありコンポーネント
export const MyComponent: Component<Props> = (props) => {
  return div(function* () { ... });
};

// ジェネレーター構文（要素内の子要素はジェネレーターを推奨）
div(function* () {
  yield* text("hello");
  yield* classes("foo");
});

// 配列構文（単純な静的コンテンツの場合は許容）
div(() => [classes("border"), text("simple")]);
```

---

## For Contributors

### 知見の記録

実装中に発見した躓きポイントや解決パターンは、関連する showcase の README に追記する。

### 新しい showcase の追加

1. `examples/showcaseN/` を作成
2. `showcase1` から設定ファイルをコピー
3. `README.md` を作成（機能説明と実装のポイント）
4. ルートで `pnpm install`
