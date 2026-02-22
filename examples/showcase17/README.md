# Showcase 17: Master-Detail Messaging

`hub.dispatch()` + `engine.on()` による DOM と Canvas 間の双方向メッセージングデモ。

## 機能

- DOM 側: カラーパレットのフィルタリング付きリスト
- Canvas 側: 選択カラーの詳細ビジュアライゼーション（RGB バー、補色、ミニパレット）
- DOM -> Canvas: クリック/ホバーで `color:select` / `color:highlight` メッセージ送信
- Canvas -> DOM: flush 時に `render:stats` メッセージで描画統計を返送
- メッセージログによる通信の可視化

## 使用パッケージ

- `@ydant/core` — scope, embed, Engine, Hub 型
- `@ydant/base` — DOM 要素ファクトリ, createHTMLElement
- `@ydant/canvas` — Canvas Backend, Canvas プラグイン, group, rect, circle, canvasText
- `@ydant/reactive` — signal, computed, reactive

## 実装のポイント

### hub.dispatch() による Engine 間通信

DOM 側から Canvas Engine にメッセージを送信する:

```typescript
function dispatchToCanvas(type: string, payload: Record<string, unknown>) {
  hub.dispatch(canvasEngine, { type, ...payload });
}

// クリック時に color:select メッセージを送信
dispatchToCanvas("color:select", { color });
```

### engine.on() によるメッセージ受信

Canvas Engine 側でメッセージハンドラを登録する:

```typescript
engine.on("color:select", (msg) => {
  const color = msg.color as ColorInfo;
  displayColor.set(color);
});
```

メッセージ受信で Signal を更新すると、Canvas シーン内の `reactive()` ブロックが自動的に再描画される。

### 逆方向通信（Canvas -> DOM）

Canvas Engine の `onFlush` 内で primary Engine にメッセージを送り返す:

```typescript
canvasEngine.onFlush(() => {
  canvasBackend.paint(ctx2d);

  // DOM Engine に統計情報を送信
  const primaryEngine = canvasEngine.hub.get("primary");
  if (primaryEngine) {
    canvasEngine.hub.dispatch(primaryEngine, {
      type: "render:stats",
      shapeCount: count,
      paintTime: elapsed,
    });
  }
});
```

### Engine 参照の受け渡し

`embed()` は DOM App 内で実行されるため、Canvas Engine の参照はコールバックで子コンポーネントに渡す:

```typescript
// index.ts で embed 後に参照をセット
const canvasEngine = yield * canvasBuilder.embed(Visualization);
registerHandlers(canvasEngine);
setEngineRefs(canvasEngine, canvasEngine.hub);
```

### computed による派生状態

`computed` でフィルタや選択状態を派生させ、DOM と Canvas の両方で利用する:

```typescript
export const filteredColors = computed(() => {
  const q = filter().toLowerCase();
  if (!q) return ALL_COLORS;
  return ALL_COLORS.filter((c) => c.name.toLowerCase().includes(q));
});
```

## 実行

```bash
pnpm run dev
```
