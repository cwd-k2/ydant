# Showcase 11: Canvas2D Rendering

`@ydant/canvas` による Canvas2D 描画のデモ。同じ core 処理系と base プラグインで、DOM ではなく Canvas2D をレンダリングターゲットにする。

## 機能

- `@ydant/canvas` の Capability を使った 2D シーン描画
- `group()`, `rect()`, `circle()`, `line()`, `canvasText()` による宣言的な図形定義
- `attr()` で図形のプロパティ（座標、色、サイズ）を設定

## 実装のポイント

### createCanvasBackend() と仮想ルート

Canvas にはDOM のような親子関係がないため、`createCanvasBackend()` が仮想的なツリー構造を提供する。Backend が root を内部管理するため、別途渡す必要はない:

```typescript
const canvas = createCanvasBackend();

mount(Scene, {
  backend: canvas,
  plugins: [createBasePlugin()],
});
```

### group() ラッパー

`group()` は Canvas 版の「コンテナ要素」。DOM の `div` に相当し、子要素をグループ化する:

```typescript
const Scene: Component = () =>
  group(() => [
    rect(() => [attr("x", "0"), attr("y", "0"), attr("fill", "#0f3460")]),
    circle(() => [attr("cx", "480"), attr("cy", "80"), attr("r", "40")]),
  ]);
```

### paint() で描画実行

`mount()` で仮想ツリーを構築した後、`canvas.paint(ctx2d)` で Canvas2D に実際に描画する:

```typescript
const ctx2d = canvasEl.getContext("2d")!;
canvas.paint(ctx2d);
```

## 実行

```bash
pnpm run dev
```
