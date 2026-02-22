# Showcase 16: Priority-Based Rendering

`engine.pause()` / `engine.resume()` によるフレーム予算ベースの優先度スケジューリングデモ。

## 機能

- 高優先パーティクル（少数・大）: 常にアクティブ
- 低優先パーティクル（多数・小）: フレーム予算超過時に自動 pause
- フレーム予算スライダーによる動的制御
- flush 所要時間のリアルタイム計測
- DevTools overlay による Engine 観測

## 使用パッケージ

- `@ydant/core` — scope, embed, Engine 型
- `@ydant/base` — DOM 要素ファクトリ, text, createHTMLElement
- `@ydant/canvas` — Canvas Backend, Canvas プラグイン, rect, circle, canvasText
- `@ydant/reactive` — signal, reactive
- `@ydant/devtools` — DevTools overlay

## 実装のポイント

### 2 つの Canvas Engine

高優先と低優先で別々の Canvas Backend / Engine を使用する:

```typescript
const highBackend = createCanvasBackend();
const highBuilder = scope(highBackend, [...]);

const lowBackend = createCanvasBackend();
const lowBuilder = scope(lowBackend, [...]);

// DOM App 内で embed
highEngine = yield* highBuilder.embed(HighScene);
lowEngine = yield* lowBuilder.embed(LowScene);
```

### pause() / resume() による動的制御

アニメーションループ内でフレーム時間を計測し、予算超過時に低優先 Engine を pause する:

```typescript
function loop(now: number) {
  const dt = now - lastTime;
  const budget = frameBudget();

  // 常に高優先を更新
  tickHigh();

  // フレーム予算に基づく低優先の制御
  if (dt > budget && !lowEngine.paused) {
    lowEngine.pause();
  } else if (dt < budget * 0.7 && lowEngine.paused) {
    lowEngine.resume();
  }

  if (!lowEngine.paused) {
    tickLow();
  }

  requestAnimationFrame(loop);
}
```

### onBeforeFlush / onFlush による計測

flush の開始・終了を hook して所要時間を計測する:

```typescript
let flushStart = 0;
highEngine.onBeforeFlush(() => {
  flushStart = performance.now();
});
highEngine.onFlush(() => {
  highFlushTime.set(Math.round((performance.now() - flushStart) * 100) / 100);
  highBackend.paint(highCtx2d);
});
```

### パーティクルモデルと Signal

パーティクルの状態は signal で管理し、`tick` 関数で物理演算を適用して `signal.set()` で更新する。reactive ブロック内で参照しているため、自動的に Canvas Engine に変更が伝播する。

## 実行

```bash
pnpm run dev
```
