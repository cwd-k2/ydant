# Showcase 11: Canvas2D Rendering

`@ydant/canvas` による Canvas2D 描画のデモ。同じ core 処理系と base プラグインで、DOM ではなく Canvas2D をレンダリングターゲットにする。

## 機能

- `@ydant/canvas` の Capability を使った 2D シーン描画
- `group()`, `rect()`, `circle()`, `line()`, `canvasText()` による宣言的な図形定義
- `attr()` で図形のプロパティ（座標、色、サイズ）を設定

## 実装のポイント

### createCanvasCapabilities() と仮想ルート

Canvas にはDOM のような親子関係がないため、`createCanvasCapabilities()` が仮想的なツリー構造を提供する。`capabilities.root` を `mount()` の `root` に渡す:

```typescript
const capabilities = createCanvasCapabilities();

mount(Scene, {
  root: capabilities.root,
  plugins: [capabilities, createBasePlugin()],
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

`mount()` で仮想ツリーを構築した後、`capabilities.paint(ctx2d)` で Canvas2D に実際に描画する:

```typescript
const ctx2d = canvasEl.getContext("2d")!;
capabilities.paint(ctx2d);
```

## 実行

```bash
pnpm run dev
```
