# Showcase 10: Form Validation

SlotRef のみで実現する細粒度フォームバリデーション。reactive プラグインなし、`@ydant/base` だけの最小構成。

## 使用パッケージ

- `@ydant/core` - mount
- `@ydant/base` - 要素、プリミティブ、SlotRef

## 主要パターン

### フィールドごとの SlotRef

各フィールドに独立した `createSlotRef()` を持ち、バリデーションエラーを個別に表示・クリアする。

```typescript
const errorRefs = {
  username: createSlotRef(),
  email: createSlotRef(),
  password: createSlotRef(),
  confirm: createSlotRef(),
};

// エラー表示の更新
errorRefs.username.refresh(renderError(field.error));
```

### blur + input のバリデーション戦略

1. **blur 時**: `touched = true` にしてバリデーション実行（初回トリガー）
2. **input 時**: `touched` なら即座にバリデーション（リアルタイム検証）
3. **submit 時**: 全フィールドを `touched = true` にして一括検証

### refresh() に Builder を渡す

`slotRef.refresh()` にジェネレータ関数を渡すことで、エラー表示の中身を丸ごと差し替える。

```typescript
function renderError(error: string | null): () => Render {
  return function* () {
    if (error) {
      yield* span({ class: "text-red-500 text-sm mt-1" }, error);
    }
  };
}
```

### パスワード強度メーター

パスワード入力のたびに専用の `strengthRef` を更新。視覚的なバーとラベルを表示する。

## バリデーションルール

| フィールド | ルール                         |
| ---------- | ------------------------------ |
| username   | 必須、3文字以上、英数字のみ    |
| email      | 必須、メール形式               |
| password   | 必須、8文字以上 + 強度メーター |
| confirm    | password と一致                |

## 設計上の発見

1. **reactive なしで十分動く** — イベントハンドラ + SlotRef で細粒度更新が実現できる。Signal が不要なケースの好例
2. **SlotRef は「何を更新するか」の明示** — reactive の暗黙的な依存追跡と対照的。フォームのようにイベント駆動が明確な場合は SlotRef の方が直感的
3. **クロスフィールドバリデーション** — パスワード変更時に confirm フィールドも再検証する。SlotRef パターンでは更新対象を明示的に指定するため、依存関係が見える

## 起動

```bash
pnpm dev
```
