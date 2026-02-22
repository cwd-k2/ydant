# Ydant Testing Philosophy

## テストの基本姿勢

Ydant におけるテストは「実装の動作確認」ではなく **「ライブラリが満たすべき仕様」** を表現する。

### 3 つの原則

1. **振る舞いをテストする、実装をテストしない**
   - テストは「仕様としてこう動くべき」を記述する
   - 実装の内部状態（フラグ、プライベート変数）に依存しない
   - ユーザー視点で観測可能な振る舞いを検証する

2. **テストが壊れたら実装を疑う**
   - テストは仕様を表現している。テストが落ちたら実装を修正する
   - 仕様変更が理由でない限り、テストを実装に合わせて書き換えない

3. **テストはリスクへの投資である**
   - 全てを均等にテストするのではなく、壊れたときの影響が大きい箇所に注力する
   - 「不安がなくなるまでテストを書き、退屈になったらやめる」(Kent Beck)

---

## テストの経済学

### 何を重点的にテストするか

**高い投資価値:**

- **公開 API の契約** — ユーザーが依存する振る舞い。壊れると影響が広い
- **エッジケース・境界値** — バグの温床になりやすい箇所
- **バグ修正** — 再発防止。修正前に再現テストを書く
- **cleanup / dispose** — リソースリークは発見が遅れると致命的

**中程度の投資価値:**

- **エラーハンドリング** — 不正入力への対応、例外時の状態復旧
- **プラグイン間の協調** — 統合テストで検証

**低い投資価値（テストしないことも選択肢）:**

- **単純な re-export** — index.ts の export はカバレッジ除外で問題ない
- **型レベルのみの制約** — TypeScript の型チェックに委ねる
- **他パッケージが保証する振る舞い** — 自分のテストでは信頼する

### カバレッジの考え方

カバレッジは参考指標であり、目標値ではない。
カバレッジ 100% を追求すると、仕様的に意味のないテストが増える。
**「このテストは何のリスクを軽減しているか」** を常に問う。

---

## TDD の適用

### Red-Green-Refactor

TDD の基本サイクル:

1. **Red** — 失敗するテストを書く（仕様を定義する）
2. **Green** — テストを通す最小限の実装を書く
3. **Refactor** — テストが通る状態を維持しつつコードを整理する

### TDD が有効な場面

| 場面                      | 理由                                               |
| ------------------------- | -------------------------------------------------- |
| 仕様が明確な機能追加      | 先にテストで仕様を定義し、実装をガイドできる       |
| バグ修正                  | 再現テストを先に書くことで修正の正しさを保証できる |
| 既存 API への振る舞い追加 | 既存テストが安全網になる                           |
| リファクタリング          | テストが不変条件を保証する                         |

### Spike → Test が有効な場面

| 場面                       | 理由                                                                         |
| -------------------------- | ---------------------------------------------------------------------------- |
| 新しい API の設計探索      | API の形が定まっていない段階でテストを書くと、テスト自体の書き直しが多発する |
| 実験的な機能のプロトタイプ | まず動くものを作り、API が安定してからテストで仕様を固める                   |

Spike 後は必ずテストを書く。**テストのない Spike コードは本番に入れない。**

### 仮実装 → 三角測量 → 本実装

t_wada の推奨する TDD の進め方:

1. **仮実装**: テストを通す最もシンプルな実装（定数を返すなど）
2. **三角測量**: 2 つ目のテストケースを追加し、仮実装では通らない状況を作る
3. **本実装**: 一般化された正しい実装に到達する

```typescript
// 1. 仮実装
it("matches exact path", () => {
  expect(matchPath("/users", "/users")).toBeTruthy();
});
// → return pattern === path; // これで通る

// 2. 三角測量
it("extracts path parameters", () => {
  expect(matchPath("/users/:id", "/users/42")).toEqual({ id: "42" });
});
// → 仮実装では通らない。本実装が必要

// 3. 本実装に到達
```

---

## テストの書き方

### AAA パターン（Arrange-Act-Assert）

```typescript
it("updates value with set()", () => {
  // Arrange: テスト対象と前提条件を準備
  const count = signal(0);

  // Act: テスト対象の操作を実行
  count.set(5);

  // Assert: 期待する結果を検証
  expect(count()).toBe(5);
});
```

短いテストではコメントを省略してよいが、3 フェーズの構造は維持する。

### 命名規則

**describe**: 対象の名前（関数名、メソッド名、機能名）

```typescript
describe("signal", () => {
  describe("set", () => {
    /* ... */
  });
  describe("update", () => {
    /* ... */
  });
  describe("subscribe", () => {
    /* ... */
  });
});
```

**it**: 期待する振る舞いを説明する。`should` は使わない。

```typescript
// GOOD: 動詞で始める
it("returns initial value", () => {});
it("notifies subscribers on change", () => {});
it("does not notify when value is same", () => {});

// BAD: should を使う
it("should return initial value", () => {});
```

### describe のネスト

正常系・異常系・エッジケースの分類は有用だが、機能単位で自然にグループ化する方を優先する:

```typescript
describe("signal", () => {
  it("returns initial value", () => {});

  describe("set", () => {
    it("updates value with set()", () => {});
    it("does not notify when value is same (Object.is)", () => {});
    it("handles NaN equality correctly", () => {});
  });

  describe("subscribe", () => {
    it("notifies subscribers on change", () => {});
    it("returns unsubscribe function", () => {});
  });

  describe("dispose", () => {
    it("removes all subscribers", () => {});
  });
});
```

### テストの粒度

| レベル     | 目的                         | 例                                |
| ---------- | ---------------------------- | --------------------------------- |
| 単体テスト | 個々の関数・モジュールの契約 | signal(), computed(), isTagged()  |
| 統合テスト | 複数コンポーネントの協調     | mount → render → plugin.process() |

単体テストを中心に据え、プラグインの協調動作は統合テストで補う。
E2E テストは examples/ が実質的にその役割を担う。

---

## テストダブルの使い分け

### vi.fn()（スタブ / スパイ）

コールバックやハンドラの呼び出しを検証する:

```typescript
const handler = vi.fn();
// ... button({ onClick: handler }) など ...
element.click();
expect(handler).toHaveBeenCalledTimes(1);
```

### vi.spyOn()（スパイ）

既存のオブジェクトのメソッドを監視する。テスト後は必ず復元する:

```typescript
const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
// ... テスト ...
warn.mockRestore();
```

### mockImplementation（モック）

外部依存を差し替える:

```typescript
vi.spyOn(window, "getComputedStyle").mockReturnValue({
  transitionDuration: "0.3s",
} as CSSStyleDeclaration);
```

### 過度なモックを避ける

モックが多いテストは実装詳細に依存している兆候。
**「このモックがないとテストできない」理由が外部依存（DOM API, タイマー）であれば正当。
内部モジュール間のモックは設計を見直すサインかもしれない。**

---

## テストの品質

### 速度

TDD の Red-Green-Refactor サイクルはフィードバックの速さが生命線。

- happy-dom を使用（jsdom より高速）
- テストごとに最小限のセットアップ
- 不要な DOM 操作やタイマー待ちを避ける

### 独立性

テストは任意の順序で実行しても結果が同じであること。

- `beforeEach` / `afterEach` で状態をリセット
- プラグインがスコープ化した状態は `mount()` / unmount の自然なライフサイクルで分離される
- 残存するグローバル状態がある場合は `__resetForTesting__()` で分離
- テスト間で共有される変数は `let` + `beforeEach` で初期化

### 決定性

同じコードに対して同じテストが常に同じ結果を返すこと。

- `vi.useFakeTimers()` でタイマーを制御
- 非同期処理は明示的に待機（`await vi.runAllTimersAsync()`）
- ランダム性や環境依存を排除

### テスト自体のリファクタリング

テストもコードである。以下の場合はテストを変更してよい:

- **仕様変更**: 仕様が変わればテストも変わる。これは正常
- **可読性向上**: ヘルパー関数の導入、describe 構造の改善
- **テストの重複排除**: `it.each` や共通セットアップへの統合

以下の場合はテストを変更すべきでない:

- **テストが落ちたから**: 実装を修正する方が正しい（仕様変更でない限り）
- **カバレッジのため**: テストは仕様を表現するもので、カバレッジ目標のためのものではない

---

## Ydant 固有のテストパターン

### DOM テストのセットアップ

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

### テスト間の状態分離

推奨: プラグインのスコーピング（`initContext` による per-mount 状態）と `mount()` / unmount の自然なライフサイクルで分離する。

スコーピングでカバーできない残存グローバル状態がある場合のみ `__resetForTesting__()` を使う:

```typescript
import { __resetForTesting__ } from "../tracking";

beforeEach(() => {
  __resetForTesting__();
});
```

### cleanup / dispose のテスト

リソース確保には対応する解放テストを書く。DOM ライブラリにとってリソースリークは致命的。

```typescript
describe("cleanup", () => {
  it("removes event listeners on dispose", () => {});
  it("clears subscriptions on dispose", () => {});
  it("calls onUnmount callbacks on refresh", () => {});
});
```

### プラグインテスト

プラグインは `mount()` を通した統合テストで検証する:

```typescript
it("processes custom child type through plugin", () => {
  const handle = mount(
    container,
    () => {
      return (function* () {
        yield* myPrimitive("value");
      })();
    },
    { plugins: [createMyPlugin()] },
  );

  expect(container.textContent).toBe("value");
  handle.dispose();
});
```

---

## 避けるべきパターン

### 実装に寄せたテスト

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

### 実装の都合でスキップ

```typescript
// BAD: 実装が対応していないからテストしない
it.skip("batch() batches signal updates", () => {});

// GOOD: 仕様としてテストを書き、実装を修正する
it("batch() batches signal updates", () => {
  // このテストが落ちるなら実装を修正する
});
```

### カバレッジのためだけのテスト

```typescript
// BAD: 仕様的に意味がない
it("constructor sets default values", () => {
  const s = signal(0);
  expect(s).toBeDefined(); // 何を保証しているのか不明
});

// GOOD: 仕様を表現する
it("returns initial value", () => {
  const s = signal(42);
  expect(s()).toBe(42); // 「初期値を返す」という仕様
});
```

### 過度なモック

```typescript
// BAD: 内部モジュールをモックし、テストが実装に密結合
vi.mock("../internal/scheduler", () => ({
  schedule: vi.fn((fn) => fn()),
}));

// GOOD: 公開 API を通して振る舞いを検証
it("schedules updates in batch", () => {
  batch(() => {
    count.set(1);
    count.set(2);
  });
  expect(effectFn).toHaveBeenCalledTimes(1); // 1 回だけ実行
});
```

---

## テストと仕様の同期

- README に書かれた仕様はテストでカバーされていること
- テストで発見した重要な振る舞いは README にも反映する
- 「テストが通れば仕様を満たしている」という信頼性を維持する
