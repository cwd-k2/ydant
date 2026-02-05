---
name: ydant-guide
description: Ydant ライブラリのアーキテクチャ、API、開発フローについて回答する。プロジェクト構造、パッケージ、設計思想について質問されたときに使用。
---

# Ydant 開発ガイド

Ydant は JavaScript ジェネレーターを DSL として使う実験的 DOM レンダリングライブラリです。

## 設計思想

### core/base 分離

**@ydant/core** は「何をレンダリングするか」を知らない純粋な処理系：

- ジェネレーターの処理、プラグイン呼び出し、コンテキスト管理のみ
- DOM の存在を仮定しない

**@ydant/base** は「どのようにレンダリングするか」を知る利用者向け API：

- 要素ファクトリ（div, span, button など）
- プリミティブ（text, attr, on, classes, style）
- DOM 操作、lifecycle

## パッケージ構成

| パッケージ          | 役割                                |
| ------------------- | ----------------------------------- |
| `@ydant/core`       | 処理系、プラグインシステム、mount() |
| `@ydant/base`       | 要素ファクトリ、プリミティブ、Slot  |
| `@ydant/reactive`   | Signal ベースのリアクティビティ     |
| `@ydant/context`    | Context API                         |
| `@ydant/router`     | SPA ルーティング                    |
| `@ydant/async`      | Suspense、ErrorBoundary             |
| `@ydant/transition` | CSS トランジション                  |

## 基本パターン

### コンポーネント定義

```typescript
// Props なし
function MyComponent(): Render {
  return div(function* () {
    yield* text("Hello");
  });
}

// Props あり
const MyComponent: Component<Props> = (props) => {
  return div(function* () {
    yield* text(props.message);
  });
};
```

### Slot による部分更新

```typescript
let countSlot: Slot;

countSlot = yield * div(() => [text(`Count: ${count}`)]);

// 後から部分更新
countSlot.refresh(() => [text(`Count: ${newCount}`)]);
```

## 開発コマンド

```bash
pnpm install              # 依存関係インストール
pnpm -r run build         # 全パッケージビルド
pnpm run dev              # dev サーバー起動
pnpm test:run             # テスト（単発）
pnpm lint:fix             # リント + 自動修正
pnpm typecheck            # 型チェック
```

## ドキュメント配置

| 情報             | 配置先                       |
| ---------------- | ---------------------------- |
| API 仕様         | `packages/*/README.md`       |
| 使用例・機能一覧 | `README.md` / `README.ja.md` |
| 実装パターン     | `examples/*/README.md`       |
| 命名規則         | `docs/CONVENTIONS.md`        |
| 開発ガイド       | `CLAUDE.md`                  |
| プロジェクト知見 | `docs/PROJECT_KNOWLEDGE.md`  |

## 命名規則

- **`create*`**: 設定・構築を伴う生成（createBasePlugin, createContext など）
- **`get*`**: 状態取得（getRoute など）
- **PascalCase**: 内部構造を持つコンポーネント（Suspense, ErrorBoundary, Transition）
- **lowercase**: プリミティブ、要素ファクトリ（text, attr, div, reactive）

詳細は `docs/CONVENTIONS.md` を参照。

## 実装例（showcase）

7つの段階的な例が `examples/` にあります：

1. **showcase1** - カウンター＆ダイアログ（基本的な Slot）
2. **showcase2** - ToDo アプリ（CRUD、localStorage）
3. **showcase3** - ポモドーロタイマー（SVG、lifecycle）
4. **showcase4** - SPA デモ（Router、Context、Reactive）
5. **showcase5** - ソート可能リスト（key() による効率的更新）
6. **showcase6** - 非同期コンポーネント（Suspense、ErrorBoundary）
7. **showcase7** - トランジション（enter/leave アニメーション）
