# Showcase 11: Canvas Embed

DOM レンダリングの中に `scope().embed()` で Canvas scope を埋め込むデモ。`scope()` builder による実行環境の切り替えを実演する。

## 機能

- DOM 内に `<canvas>` 要素を配置し、`scope().embed()` で Canvas backend に切り替え
- 同一 `mount()` 内で DOM と Canvas2D が共存
- `group()`, `rect()`, `circle()`, `line()`, `canvasText()` による宣言的な図形定義

## 実装のポイント

### scope().embed() による scope 切り替え

`scope()` で Canvas backend + plugins を束ね、`.embed()` で子の描画を Canvas scope に委譲する:

```typescript
const canvasBackend = createCanvasBackend();

// DOM 要素として <canvas> を配置
const slot =
  yield *
  canvas(function* () {
    yield* attr("width", "600");
    yield* attr("height", "400");
  });

// Canvas scope に切り替え — VShape ツリーを構築
yield * scope(canvasBackend, [createBasePlugin()]).embed(NightScene);

// 仮想ツリーを実際の canvas に描画
canvasBackend.paint((slot.node as HTMLCanvasElement).getContext("2d")!);
```

### DOM と Canvas の共存

`embed()` は同期的に完了するため、前後に DOM 要素を自由に配置できる:

```
DOM scope:
  h1 "Canvas Embed"
  p  "DOM content above..."
  <canvas>
    [Canvas scope] ← scope().embed() で切り替え
    group > rect, circle, line, ...
  </canvas>
  p  "DOM content below..."
```

### embed plugin の自動登録

`scope()` は embed plugin を自動的に登録する。ユーザーが `createEmbedPlugin()` を意識する必要はない:

```typescript
scope(createDOMBackend(root), [createBasePlugin()]).mount(App);
```

## 実行

```bash
pnpm run dev
```
