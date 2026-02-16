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

### Portal と embed の違い

Portal と `embed()` はどちらも「別の場所にレンダリングする」機能だが、抽象化のレベルが異なる:

|                | Portal                                            | embed                                          |
| -------------- | ------------------------------------------------- | ---------------------------------------------- |
| **変わるもの** | parent（DOM ノード）                              | scope（実行環境全体）                          |
| **Backend**    | 同じ DOM Backend                                  | 別の Backend に切り替え可能                    |
| **用途**       | モーダル、ツールチップなど同一 DOM 内の別ノードへ | Canvas、SVG など異なるレンダリングターゲットへ |
| **仕組み**     | `processChildren(content, { parent })`            | `processChildren(content, { scope })`          |

Portal は DOM 内の「どこに」描画するかを変える。embed は「何で」描画するかを変える。

## 実行

```bash
pnpm run dev
```
