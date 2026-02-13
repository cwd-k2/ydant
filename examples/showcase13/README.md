# Showcase 13: SSR + Hydration

`@ydant/ssr` による Server-Side Rendering と Hydration のデモ。同一コンポーネントを SSR とクライアントの両方で使用する。

## 機能

- `renderToString()` で HTML 文字列を生成
- 生成した HTML を DOM に注入（サーバーレスポンスをシミュレート）
- `hydrate()` で既存 DOM にイベントリスナーをアタッチ

## 実装のポイント

### 同一コンポーネントの SSR/クライアント兼用

`App` コンポーネントは SSR でもクライアントでもそのまま使える。サーバー側では HTML 文字列を生成し、クライアント側では既存 DOM にインタラクティビティを付与する:

```typescript
// Phase 1: SSR
const html = renderToString(App);

// Phase 2: DOM 注入
appEl.innerHTML = html;

// Phase 3: Hydration
hydrate(App, appEl);
```

### 手動 DOM 更新の設計判断

Hydration 後のインタラクション（カウンター更新）は `document.getElementById` による手動 DOM 操作で実装されている。これは SSR + Hydration の最小構成を示すための意図的な設計で、リアクティブシステムとの統合は別の課題:

```typescript
function updateCount(delta: number) {
  count += delta;
  const el = document.getElementById("count-display");
  if (el) el.textContent = String(count);
}
```

### requestAnimationFrame による Hydration タイミング

`hydrate()` は DOM が完全にレンダリングされた後に実行する必要がある。`innerHTML` 直後ではなく、次フレームで Hydration を行う:

```typescript
requestAnimationFrame(() => {
  hydrate(App, appEl);
});
```

## 実行

```bash
pnpm run dev
```
