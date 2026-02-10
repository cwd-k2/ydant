---
name: test-writing
description: TESTING.md の方針に従って新規テストを作成する。対象モジュールの仕様を理解し、リスクベースで適切なテストを設計・実装する。
---

# テスト作成ガイド

## 意図

新しいテストを `docs/TESTING.md` の方針に従って作成する。
テストは仕様の表現であり、「このテストが通れば仕様を満たしている」という信頼性を構築する。

## 作成手順

### 1. 対象の理解

引数で指定されたモジュール・機能を確認する。

- 対象の **ソースコード** を読む
- 対象パッケージの **README.md** を読み、公開仕様を把握する
- **既存テスト** があれば読み、現在のカバレッジを理解する

### 2. TESTING.md の方針を読む

`docs/TESTING.md` を読み、現在の方針を確認する。

### 3. テスト設計

#### TDD vs Spike → Test の判断

| 状況                                  | アプローチ                                 |
| ------------------------------------- | ------------------------------------------ |
| 仕様が明確（README に記載、バグ修正） | TDD: テストを先に書く                      |
| API が未確定、実験的                  | Spike → Test: 実装後にテストで仕様を固める |

#### テスト対象の優先度

リスクベースで優先度をつける:

1. **公開 API の契約** — 必ずテスト
2. **エッジケース・境界値** — バグの温床を先に潰す
3. **cleanup / dispose** — リソースリークは致命的
4. **エラーハンドリング** — 必要に応じて
5. **内部ヘルパー** — 公開 API 経由でカバーできるなら不要

テスト対象の優先度をユーザーに提案し、合意を得てからテストを書く。

### 4. テスト実装

#### ファイル配置

```
packages/<name>/src/__tests__/<module>.test.ts
```

#### テンプレート

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// 対象モジュールの import

describe("<対象名>", () => {
  // 必要に応じてセットアップ
  // let container: HTMLElement;
  // beforeEach(() => { ... });
  // afterEach(() => { ... });

  it("<動詞で始まる振る舞いの説明>", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

#### 実装ルール

- **AAA パターン** を守る（Arrange-Act-Assert）
- **命名**: describe = 対象名、it = 動詞で始める、should は使わない
- **振る舞いをテスト** する。実装の内部状態に依存しない
- **1 テスト 1 概念**: 1 つの it で 1 つの振る舞いを検証
- **独立性**: テスト間の順序依存を作らない
- **モックは最小限**: 外部依存（DOM API, タイマー）の置き換えに限定

#### DOM テストのセットアップ

mount() を使うテストでは:

```typescript
let container: HTMLElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
});
```

#### テスト間の状態分離

プラグインのスコーピング（`initContext` による per-mount 状態）と mount/unmount ライフサイクルで分離するのが基本。スコーピングでカバーできない残存グローバル状態がある場合のみ `__resetForTesting__()` を使う:

```typescript
import { __resetForTesting__ } from "../tracking";

beforeEach(() => {
  __resetForTesting__();
});
```

### 5. テストの実行と確認

テストを書いたら実行して確認:

```bash
pnpm test:run --filter <package-name>
```

- Red（失敗）→ Green（成功）の流れを確認（TDD の場合）
- 全テストが独立して通ることを確認

## 現時点の方針

- テスト作成前に対象の仕様を把握し、何をテストすべきかをユーザーと合意する
- 「このテストは何のリスクを軽減しているか」を常に問う
- カバレッジ向上が目的のテストは書かない

## 今後の検討事項

- Property-based testing の導入可能性（特に parser 系の関数）
- テストヘルパーの共通化（DOM セットアップ、mount ラッパーなど）
- Snapshot テストの採否（コンポーネント出力の回帰テスト）
