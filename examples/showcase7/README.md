# Showcase 7: CSS Transitions

createTransition による enter/leave アニメーションのデモ。

## 機能

- Fade トランジション（enter/leave 両対応）
- Slide トランジション
- Toast 通知（key() によるリスト管理）

## 実装のポイント

### createTransition の使い方

`createTransition` は `TransitionHandle` を返し、`setShow()` でアニメーション制御:

```typescript
import { createTransition, type TransitionHandle } from "@ydant/transition";

let fadeTransition: TransitionHandle;

return div(function* () {
  yield* button(function* () {
    yield* on("click", async () => {
      const isVisible = fadeTransition.slot.node.firstElementChild !== null;
      await fadeTransition.setShow(!isVisible);
    });
    yield* text("Toggle");
  });

  fadeTransition = yield* createTransition({
    enter: "fade-enter",
    enterFrom: "fade-enter-from",
    enterTo: "fade-enter-to",
    leave: "fade-leave",
    leaveFrom: "fade-leave-from",
    leaveTo: "fade-leave-to",
    children: () => div(() => [text("Animated content")]),
  });
});
```

### Transition vs createTransition

| API | Enter | Leave | 用途 |
|-----|-------|-------|------|
| `Transition` | ✅ | ❌ | シンプルな show/hide |
| `createTransition` | ✅ | ✅ | 完全なアニメーション制御 |

### CSS クラス設計

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
