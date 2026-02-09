# Ydant プロジェクト知見集

このドキュメントは Ydant プロジェクトの特性、設計思想、開発履歴をまとめたものです。

## プロジェクトの特性

### 名前の由来

**Ydant** = **Y**ou **D**on't **A**ctually **N**eed **T**his

「おそらく本当に必要ないもの」という自己言及的なユーモアを含む。これは実験的プロジェクトであり、本番環境には React/Vue/Svelte などの確立されたフレームワークを推奨している。

### 核心的なアイデア

JavaScript のジェネレーターを DSL（ドメイン固有言語）として使い、DOM 構造を宣言的に記述する。

```typescript
// ジェネレーターが yield* で DOM 命令を発行
function* () {
  yield* div(function* () {
    yield* text("Hello");
    yield* classes("container");
  });
}
```

### 設計哲学

#### core/base 分離

**@ydant/core** は「何をレンダリングするか」を知らない：

- ジェネレーターの処理
- プラグインの呼び出し
- コンテキストの管理

**@ydant/base** は「どのようにレンダリングするか」を知る：

- 要素ファクトリ（div, span, button...）
- プリミティブ（text, attr, on, classes...）
- DOM 操作、lifecycle

この分離により：

- core は小さく安定した API を維持
- base は core を変更せずに機能追加可能
- 他のプラグインは base と同じ立場で拡張可能

---

## アーキテクチャ詳細

### パッケージ依存関係

```
@ydant/core (依存なし)
    ↑
@ydant/base
    ↑
@ydant/reactive, @ydant/context
    ↑
@ydant/router, @ydant/async, @ydant/transition
```

### プラグインシステム

プラグインは以下の型を拡張できる：

| 拡張ポイント    | 用途                                        |
| --------------- | ------------------------------------------- |
| `DSLSchema`     | DSL 操作定義（instruction/feedback/return） |
| `RenderContext` | コンテキストプロパティ                      |
| `RenderAPI`     | API メソッド                                |

### Slot パターン

仮想 DOM の差分計算なしに、細粒度の DOM 更新を実現：

```typescript
let countSlot: Slot;

countSlot = yield * div(() => [text(`Count: ${count}`)]);

// 後から部分更新
countSlot.refresh(() => [text(`Count: ${newCount}`)]);
```

---

## 開発履歴

### Phase 1: 基盤構築

- ジェネレーターベースのレンダリングエンジン実装
- 基本的な要素ファクトリとプリミティブ
- mount() API の確立

### Phase 2: プラグインシステム

- プラグインアーキテクチャの設計
- @ydant/reactive（Signal ベースのリアクティビティ）
- @ydant/context（Context API）

### Phase 3: アーキテクチャ再編

- dom パッケージを core にマージ
- @ydant/base パッケージ作成
- core/base 分離の設計哲学を確立

### Phase 4: API リファクタリング

- RenderContext/RenderAPI を拡張可能に
- Component<P> 型の統合
- createSlotRef の導入
- 型エイリアスの整備

### Phase 5: 品質改善

- CONVENTIONS.md で命名規則を文書化
- 構造整理と命名統一
- 型システムの強化
- module augmentation を global.d.ts に分離

### Phase 6: 型システム統合

- 7 つのジェネレーター型を `DSL<Key>`, `Render`, `Builder` の 3 つに統合
- `Child` → `Instruction`, `ChildNext` → `Feedback` にリネーム（DSL 用語に統一）
- `ProcessResult`, `CleanupFn`, `MountOptions`, `ChildOfType` 等の薄いラッパーを廃止
- Props 命名: `children` を DOM 子要素に限定、抽象的描画関数は `content` に統一
- `toChildren` → `toRender` リネーム

---

## 学んだ教訓

### TypeScript 関連

1. **module augmentation は global.d.ts に分離**
   - ビルド成果物での型参照を安定させる
   - `/// <reference types="">` で参照

2. **型定義の重複を避ける**
   - 一箇所で定義し、re-export で共有

3. **paths から customConditions へ**
   - 型解決を pnpm workspace と整合させる

4. **DSL<Key> による型の統合**
   - 以前は `Primitive<T>`, `Instruction`, `ChildContent`, `ElementRender` など用途別の型が乱立していた
   - `DSLSchema` の `instruction` / `feedback` / `return` 3 フィールドから全てを導出する設計に統合
   - `DSL<Key>` が個別操作の型、`Render` が汎用ジェネレーター型として機能
   - 中間ラッパー（`ProcessResult` 等）も不要になり、プラグインは `Feedback` を直接返却

### 設計関連

1. **core は最小限に**
   - DOM の存在を仮定しない
   - プラグインに具体的処理を委ねる

2. **命名規則の一貫性**
   - `create*`: 設定・構築を伴う生成
   - `get*`: 状態取得
   - PascalCase: 内部構造を持つコンポーネント
   - lowercase: プリミティブ、ファクトリ

3. **暗黙的状態より明示的データを優先する**
   - 例: `pendingKey`（コンテキスト上の暗黙的な状態）→ `Element.key`（オブジェクトの明示的なフィールド）
   - 暗黙的状態は「先読み」「処理順序への依存」「状態のリセット忘れ」などの問題を招く
   - データが所属すべきオブジェクトに直接持たせることで、処理順序への依存がなくなり実装がシンプルになる
   - 判断基準: ある状態が「次に処理されるもの」への橋渡しだけに使われている場合、その情報は渡される先のオブジェクト自身が持つべき

---

## クイックリファレンス

### 開発コマンド

```bash
pnpm install              # 依存関係
pnpm -r run build         # 全パッケージビルド
pnpm run dev              # dev サーバー
pnpm test:run             # テスト（単発）
pnpm lint:fix             # リント + 修正
pnpm typecheck            # 型チェック
```

### ドキュメント配置

ドキュメントの配置ルール・テンプレートは **[docs/DOCUMENTATION.md](DOCUMENTATION.md)** を参照。

---

## 関連リソース

- [CLAUDE.md](../CLAUDE.md) - 開発ガイド
- [CONVENTIONS.md](./CONVENTIONS.md) - 命名規則・コーディングパターン
- [TESTING.md](./TESTING.md) - テスト方針
- [DOCUMENTATION.md](./DOCUMENTATION.md) - ドキュメント方針
- [README.ja.md](../README.ja.md) - プロジェクト概要
