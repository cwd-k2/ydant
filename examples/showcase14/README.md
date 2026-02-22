# Showcase 14: Reactive Canvas

Signal 駆動の Canvas 再描画デモ。DOM ボタンで Signal を変更し、Canvas シーンが自動的に再描画される。

## 機能

- Signal 変更による Canvas シーンの自動再描画
- 位置・サイズ・色のインタラクティブ操作
- 複数 Signal の同時変更によるバッチング実証
- DevTools overlay による Engine 観測

## 使用パッケージ

- `@ydant/core` — scope, embed
- `@ydant/base` — DOM 要素ファクトリ, createHTMLElement
- `@ydant/canvas` — Canvas Backend, group, rect, circle, canvasText
- `@ydant/reactive` — signal, reactive
- `@ydant/devtools` — DevTools overlay

## 実装のポイント

### DOM と Canvas の 2 スコープ構成

DOM スコープ内で Canvas スコープを `embed()` する。Signal は両スコープから共有される:

```typescript
const canvasBackend = createCanvasBackend();
const canvasBuilder = scope(canvasBackend, [
  createBasePlugin(),
  createCanvasPlugin(),
  createReactivePlugin(),
]);

// DOM App 内で Canvas シーンを embed
const canvasEngine = yield * canvasBuilder.embed(Scene);
```

### onFlush による自動再描画

Canvas Engine の flush 完了時に `paint()` を呼ぶことで、Signal 変更を Canvas に反映する:

```typescript
canvasEngine.onFlush(() => {
  canvasBackend.paint(canvasCtx2d);
});
```

`reactive()` ブロック内で Signal を参照すると、その Signal の変更が Canvas Engine のタスクキューに入り、flush 時に `onFlush` が発火する。

### バッチング

複数の Signal を同時に変更しても、flush は 1 回にまとめられる:

```typescript
// 4 つの signal.set() が 1 回の flush にバッチされる
cx.set(100 + Math.floor(Math.random() * 400));
cy.set(50 + Math.floor(Math.random() * 300));
radius.set(20 + Math.floor(Math.random() * 60));
colorIndex.update((v) => v + 1);
```

### Canvas 要素の取得

DOM 側で `<canvas>` 要素を作成し、Slot から `CanvasRenderingContext2D` を取得する:

```typescript
const canvas = createHTMLElement("canvas");
const slot = yield * canvas({ width: "600", height: "400" });
const ctx2d = (slot.node as HTMLCanvasElement).getContext("2d")!;
```

## 実行

```bash
pnpm run dev
```
