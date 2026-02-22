# Showcase 1: Counter & Dialog

基本的な Ydant の使い方を示すデモ。

## 機能

- カウンターコンポーネント（Slot による再レンダリング）
- ダイアログコンポーネント（props を受け取るコンポーネント）

## 使用パッケージ

- `@ydant/core` — scope, mount
- `@ydant/base` — 要素ファクトリ, refresh, text

## 実装のポイント

### Slot 変数の宣言パターン

イベントハンドラ内で `refresh()` を使う場合、Slot 変数を先に宣言する:

```typescript
import { html, refresh } from "@ydant/base";

let countSlot: Slot; // 先に宣言

return div(function* () {
  yield* button(
    {
      onClick: () => {
        count++;
        refresh(countSlot, () => [text(`Count: ${count}`)]); // ここで使用
      },
    },
    "+1",
  );

  countSlot = yield* div(() => [text(`Count: ${count}`)]); // 後から代入
});
```

### refresh() の引数

`refresh(slot, content)` には Slot とコンテンツを返す関数を渡す:

```typescript
// ✅ 正しい
refresh(slot, () => [text("content")]);

// ❌ 引数なしは不可
refresh(slot);
```

## 実行

```bash
pnpm run dev
```
