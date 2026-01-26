# Ydant Development Guide

## What is Ydant?

JavaScript ジェネレーターを DSL として使用する DOM レンダリングライブラリ。

## Architecture

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

## Essential Patterns

### Generator vs Array Syntax

```typescript
// Generator: Slot が必要な場合
const { refresh, node } =
  yield *
  div(function* () {
    yield* text("content");
  });

// Array: 静的構造
yield * div(() => [text("content")]);
```

### Slot の使い方

```typescript
let slot: Slot; // 先に宣言

yield *
  button(() => [
    on("click", () => slot.refresh(() => [text("updated")])), // 使用
    text("click"),
  ]);

slot = yield * div(() => [text("initial")]); // 代入
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

## For Contributors

### 知見の記録

実装中に発見した躓きポイントや解決パターンは、関連する showcase の README に追記する。

### 新しい showcase の追加

1. `examples/showcaseN/` を作成
2. `showcase1` から設定ファイルをコピー
3. `README.md` を作成（機能説明と実装のポイント）
4. ルートで `pnpm install`
