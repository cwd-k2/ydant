# Showcase 1: Counter & Dialog

基本的な Ydant の使い方を示すデモ。

## 機能

- カウンターコンポーネント（Slot による再レンダリング）
- ダイアログコンポーネント（props を受け取るコンポーネント）

## 実装のポイント

### Slot 変数の宣言パターン

イベントハンドラ内で `Slot.refresh()` を使う場合、Slot 変数を先に宣言する:

```typescript
let countSlot: Slot; // 先に宣言

return div(function* () {
  yield* button(function* () {
    yield* on("click", () => {
      count++;
      countSlot.refresh(() => [text(`Count: ${count}`)]); // ここで使用
    });
    yield* text("+1");
  });

  countSlot = yield* div(() => [text(`Count: ${count}`)]); // 後から代入
});
```

### Slot.refresh() の引数

`refresh()` には必ずコンテンツを返す関数を渡す:

```typescript
// ✅ 正しい
slot.refresh(() => [text("content")]);

// ❌ 引数なしは不可
slot.refresh();
```

## 実行

```bash
pnpm run dev
```
