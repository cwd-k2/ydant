# Showcase 8: Notification Feed

`createTransitionGroupRefresher` によるリストの追加・削除アニメーションのデモ。

## 使用パッケージ

- `@ydant/core` - mount
- `@ydant/base` - 要素、プリミティブ、SlotRef
- `@ydant/transition` - createTransitionGroupRefresher

## 主要パターン

### createTransitionGroupRefresher

refresher を一度作成し、`(slot, items)` で呼び出すたびに差分検出してアニメーション付き更新を行う。

```typescript
const refresher = createTransitionGroupRefresher<Notification>({
  keyFn: (n) => n.id,
  enter: "notif-enter",
  enterFrom: "notif-enter-from",
  enterTo: "notif-enter-to",
  leave: "notif-leave",
  leaveFrom: "notif-leave-from",
  leaveTo: "notif-leave-to",
  content: (n) => NotificationItem(n, () => remove(n.id)),
});

// 更新時
refresher(slot, filteredItems());
```

### フィルタリングとアニメーション

フィルタを切り替えると表示アイテムが変化し、消えるアイテムには leave、現れるアイテムには enter が自動適用される。
フィルタ処理自体は JavaScript の `Array.filter()` で行い、結果を refresher に渡すだけ。

### CSS トランジション定義

enter/leave の各フェーズに対応するクラスを CSS で定義する。

```css
.notif-enter {
  transition: all 300ms ease-out;
}
.notif-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.notif-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.notif-leave {
  transition: all 300ms ease-in;
}
.notif-leave-from {
  opacity: 1;
  transform: scale(1);
}
.notif-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
```

## 設計上の発見

1. **refresher は Slot を引数に取る** — `SlotRef.bind()` で取得した Slot をそのまま渡す。`SlotRef.refresh()` は使わず、refresher が内部で `slot.refresh()` を呼ぶ
2. **フィルタリング = アイテム差し替え** — 実データを変更せずフィルタ結果だけ渡せば、見た目上の追加・削除としてアニメーションが発動する
3. **content コールバックにイベントハンドラを含められる** — `content: (n) => NotificationItem(n, () => remove(n.id))` のように、削除ハンドラをクロージャで渡すのが自然なパターン

## 起動

```bash
pnpm dev
```
