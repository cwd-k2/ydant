# Showcase 11: Canvas Embed

DOM レンダリングの中に `embed()` で Canvas scope を埋め込むデモ。`ExecutionScope` による実行環境の切り替えを実演する。

## 機能

- DOM 内に `<canvas>` 要素を配置し、`embed()` で Canvas backend に切り替え
- 同一 `mount()` 内で DOM と Canvas2D が共存
- `group()`, `rect()`, `circle()`, `line()`, `canvasText()` による宣言的な図形定義

## 実装のポイント

### embed() による scope 切り替え

`createExecutionScope` で Canvas backend + plugins を束ね、`embed()` で子の描画を Canvas scope に委譲する:

```typescript
const canvasBackend = createCanvasBackend();
const canvasScope = createExecutionScope(canvasBackend, [createBasePlugin()]);

// DOM 要素として <canvas> を配置
const slot =
  yield *
  canvas(function* () {
    yield* attr("width", "600");
    yield* attr("height", "400");
  });

// Canvas scope に切り替え — VShape ツリーを構築
yield * embed(canvasScope, NightScene);

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
    [Canvas scope] ← embed() で切り替え
    group > rect, circle, line, ...
  </canvas>
  p  "DOM content below..."
```

### createEmbedPlugin の登録

`embed()` spell は **親 scope の plugin** が処理する。DOM 側の mount に `createEmbedPlugin()` を登録:

```typescript
mount(App, {
  backend: createDOMBackend(root),
  plugins: [createBasePlugin(), createEmbedPlugin()],
});
```

Canvas scope には Canvas 用の `createBasePlugin()` のみ。embed plugin は不要。

## 実行

```bash
pnpm run dev
```
