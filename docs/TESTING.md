# Ydant Testing Philosophy

## テストの役割

Ydant におけるテストは「実装の動作確認」ではなく **「ライブラリが満たすべき仕様」** を表現する。

### 原則

1. **仕様としてのテスト**
   - テストは「実装がこう動く」ではなく「仕様としてこう動くべき」を記述する
   - 実装の内部状態（フラグ、プライベート変数）に依存しない
   - ユーザー視点で観測可能な振る舞いをテストする

2. **TDD アプローチ**
   - 新機能: テストを先に書き、テストが落ちることを確認してから実装
   - バグ修正: 再現テストを先に書き、修正後にパスすることを確認
   - テストが落ちたら実装を修正する（テストを実装に合わせない）

3. **テストが仕様を定義する**
   - README に書かれた仕様がテストでカバーされていること
   - テストにしか書かれていない仕様は README にも反映する
   - 「テストが通れば仕様を満たしている」という信頼性を維持

## テストの構造

### 単体テスト vs 統合テスト

| レベル     | 目的                     | 例                                |
| ---------- | ------------------------ | --------------------------------- |
| 単体テスト | 個々の関数・クラスの契約 | signal(), computed(), isTagged()  |
| 統合テスト | 複数コンポーネントの協調 | mount → render → plugin.process() |
| E2E テスト | ユーザーシナリオ         | examples/\* での動作確認          |

### テストケースの命名

```typescript
describe("機能名", () => {
  describe("正常系", () => {
    it("期待される動作を説明する文", () => {});
  });

  describe("異常系", () => {
    it("エラー条件下での期待される動作", () => {});
  });

  describe("エッジケース", () => {
    it("境界条件での期待される動作", () => {});
  });
});
```

## 必須テストカテゴリ

各パッケージで以下のカテゴリをカバーする:

1. **公開 API の契約**
   - 引数の型、戻り値、副作用
   - README に記載された使用例

2. **ライフサイクル**
   - 初期化、更新、破棄（cleanup/dispose）
   - リソースリーク防止の確認

3. **エラーハンドリング**
   - 不正な入力への対応
   - 例外発生時の状態復旧

4. **状態管理**
   - テスト間の状態分離
   - グローバル状態の **resetForTesting**() 使用

## 避けるべきパターン

### ❌ 実装に寄せたテスト

```typescript
// BAD: 実装の内部状態に依存
it("isAnimating flag is set during animation", () => {
  expect(transition._isAnimating).toBe(true);
});

// GOOD: 観測可能な振る舞いをテスト
it("ignores setShow calls during animation", () => {
  transition.setShow(true);
  transition.setShow(false); // should be ignored
  expect(element.classList.contains("enter")).toBe(true);
});
```

### ❌ 実装の都合でスキップ

```typescript
// BAD: 実装が対応していないからテストしない
it.skip("batch() batches signal updates", () => {});

// GOOD: 仕様としてテストを書き、実装を修正
it("batch() batches signal updates", () => {
  // このテストが落ちるなら実装を修正する
});
```

## cleanup / dispose のテスト

すべてのリソース確保には対応する解放テストを書く:

```typescript
describe("cleanup", () => {
  it("removes event listeners on dispose", () => {});
  it("clears intervals on dispose", () => {});
  it("calls onUnmount callbacks on refresh", () => {});
});
```
