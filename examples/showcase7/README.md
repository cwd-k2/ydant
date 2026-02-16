# Showcase 7: CSS Transitions

`@ydant/transition` パッケージのデモ。単一要素のアニメーション（createTransition）とリストのアニメーション（createTransitionGroupRefresher）の両方を実演する。

## 機能

- Fade トランジション（enter/leave 両対応）
- Slide トランジション
- Toast 通知（TransitionGroup によるリストアニメーション）

## 実装のポイント

### createTransition — 単一要素の enter/leave

`createTransition` は `TransitionHandle` を返し、`setShow()` でアニメーション制御:

```typescript
fadeTransition =
  yield *
  createTransition({
    enter: "fade-enter",
    enterFrom: "fade-enter-from",
    enterTo: "fade-enter-to",
    leave: "fade-leave",
    leaveFrom: "fade-leave-from",
    leaveTo: "fade-leave-to",
    content: () => div(() => [text("Animated content")]),
  });

await fadeTransition.setShow(!isVisible);
```

### createTransitionGroupRefresher — リストの enter/leave

refresher を一度作成し、`(slot, items)` で呼び出すたびに差分検出してアニメーション付き更新:

```typescript
const refresher = createTransitionGroupRefresher<Toast>({
  keyFn: (t) => t.id,
  enter: "scale-enter",
  enterFrom: "scale-enter-from",
  enterTo: "scale-enter-to",
  leave: "scale-leave",
  leaveFrom: "scale-leave-from",
  leaveTo: "scale-leave-to",
  content: (toast) => div(() => [text(toast.message)]),
});

// 追加アイテムは enter、削除アイテムは leave が自動適用
refresher(slot, toasts);
```

### CSS クラス設計

enter/leave の各フェーズに対応するクラスを CSS で定義する:

```css
.fade-enter {
  transition: opacity 300ms ease;
}
.fade-enter-from {
  opacity: 0;
}
.fade-enter-to {
  opacity: 1;
}
.fade-leave {
  transition: opacity 300ms ease;
}
.fade-leave-from {
  opacity: 1;
}
.fade-leave-to {
  opacity: 0;
}
```

## 実行

```bash
pnpm run dev
```
