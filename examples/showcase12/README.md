# Showcase 12: Portal for Modal Dialogs

`@ydant/portal` によるモーダルダイアログのデモ。親コンテナの overflow やスタッキングコンテキストを超えて、別の DOM ターゲットにレンダリングする。

## 機能

- `portal()` で `#modal-root` にモーダルをレンダリング
- ボタンクリックでモーダルの開閉
- オーバーレイクリックでの閉じ動作

## 実装のポイント

### portal() による別ターゲットへのレンダリング

`portal(target, content)` は、`content` を現在の DOM ツリーではなく `target` 要素の中にレンダリングする:

```typescript
const modalRoot = document.getElementById("modal-root")!;

const App: Component = () =>
  div(() => [
    button(() => [on("click", () => openModal()), text("Open Modal")]),
    portal(modalRoot, () => [div(() => [attr("class", "modal-overlay") /* ... */])]),
  ]);
```

### DOM イベントによる開閉制御

モーダルの表示/非表示は `style.display` の切り替えで制御する。Portal 内のコンテンツは常に DOM に存在し、CSS で表示を制御する設計:

```typescript
function openModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.style.display = "flex";
}
```

## 実行

```bash
pnpm run dev
```
