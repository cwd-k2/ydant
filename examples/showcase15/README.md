# Showcase 15: Multi-Target Dashboard

DOM / Canvas / SSR の 3 つのレンダリングターゲットが同一 Hub 下で共存するダッシュボードデモ。

## 機能

- DOM パネル: データリスト表示 + コントロールボタン
- Canvas パネル: リアクティブ棒グラフ
- SSR パネル: HTML プレビュー（テーブル形式）
- 3 種類の Scheduler 共存（DOM=microtask, Canvas=animFrame, SSR=sync）
- 各 Engine の flush 回数表示

## 使用パッケージ

- `@ydant/core` — scope, embed
- `@ydant/base` — DOM 要素ファクトリ, text, createHTMLElement
- `@ydant/canvas` — Canvas Backend, Canvas プラグイン
- `@ydant/ssr` — SSR Backend (toHTML)
- `@ydant/reactive` — signal, computed, reactive
- `@ydant/devtools` — DevTools overlay

## 実装のポイント

### 3 つのスコープの構築

各ターゲットに対応する Backend + Plugin で scope を構築し、DOM App 内で `embed()` する:

```typescript
// Canvas scope (animFrame scheduler)
const canvasBackend = createCanvasBackend();
const canvasBuilder = scope(canvasBackend, [
  createBasePlugin(),
  createCanvasPlugin(),
  createReactivePlugin(),
]);

// SSR scope (sync scheduler)
const ssrBackend = createSSRBackend();
const ssrBuilder = scope(ssrBackend, [createBasePlugin(), createReactivePlugin()]);

// DOM App 内で embed
const canvasEngine = yield * canvasBuilder.embed(Chart);
const ssrEngine = yield * ssrBuilder.embed(Preview);
```

### Scheduler の違い

3 つの Engine はそれぞれ異なるタイミングで flush される:

- **DOM (microtask)**: Signal 変更後の次の microtask で flush
- **Canvas (animFrame)**: requestAnimationFrame で flush
- **SSR (sync)**: Signal 変更時に即座に flush

### Signal の共有

Signal は scope 外で定義するため、全ターゲットから参照可能。変更は各 Engine の Scheduler タイミングで反映される:

```typescript
// signals.ts — 全スコープで共有
export const dataPoints = signal<DataPoint[]>([...]);
export const chartTitle = signal("Dashboard");
```

### SSR の HTML 出力

SSR Engine の flush 時に `toHTML()` でシリアライズし、その結果を Signal 経由で DOM 側に反映する:

```typescript
ssrEngine.onFlush(() => {
  htmlPreview.set(ssrBackend.toHTML());
});
```

### primary Engine の参照

`hub.engines()` で列挙し、`engine.id === "primary"` で mount 元の Engine を特定する:

```typescript
for (const engine of handle.hub.engines()) {
  if (engine.id === "primary") {
    engine.onFlush(() => domFlushCount.update((n) => n + 1));
  }
}
```

## 実行

```bash
pnpm run dev
```
