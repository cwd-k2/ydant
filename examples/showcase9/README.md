# Showcase 9: Admin Dashboard

Route Guards と `createResource({ refetchInterval })` のデモ。認証つきダッシュボードで、メトリクスが自動更新される。

## 使用パッケージ

- `@ydant/core` - mount
- `@ydant/base` - 要素、プリミティブ、SlotRef
- `@ydant/router` - RouterView, RouteDefinition.guard, navigate
- `@ydant/async` - createResource, Suspense

## 主要パターン

### Sync Route Guard with Redirect

```typescript
{
  path: "/dashboard",
  component: DashboardPage,
  guard: () => {
    if (!isLoggedIn()) {
      navigate(`${basePath}/login`);
      return false;
    }
    return true;
  },
}
```

guard が `false` を返すと空 view がレンダリングされる。組み込みのリダイレクト機構はないため、`navigate()` を guard 内で手動で呼ぶ。

### createResource + refetchInterval

```typescript
const metricsResource = createResource(fetchMetrics, { refetchInterval: 5000 });
```

5秒ごとにデータを自動再フェッチ。ただし **UI は自動更新されない** — `refetchInterval` はデータ層のみ。

### UI ポーリング更新パターン

`refetchInterval` がデータを更新しても、表示を更新するには別途ポーリングが必要。

```typescript
const pollTimer = setInterval(() => {
  try {
    const m = metricsResource.peek();
    metricsRef.refresh(/* render metrics */);
  } catch {
    // まだロード中 — スキップ
  }
}, 5000);
```

`resource.peek()` でデータを取得し（ロード中は例外）、`SlotRef.refresh()` で UI を更新する。

### Suspense による初回ロード

```typescript
yield *
  Suspense({
    fallback: () => div(() => [text("Loading metrics...")]),
    content: function* () {
      const m = metricsResource(); // pending なら Promise を throw → fallback 表示
      // 初回レンダリング...
    },
  });
```

### クリーンアップ

```typescript
yield *
  onUnmount(() => {
    metricsResource.dispose(); // refetchInterval を停止
    if (pollTimer) clearInterval(pollTimer);
  });
```

## ページ構成

| パス         | コンポーネント | Guard                        |
| ------------ | -------------- | ---------------------------- |
| `/`          | HomePage       | なし                         |
| `/login`     | LoginPage      | なし                         |
| `/dashboard` | DashboardPage  | sync (isLoggedIn + redirect) |
| `*`          | NotFoundPage   | なし                         |

## 設計上の発見

1. **guard が false → 空 view、リダイレクトなし** — ログインリダイレクトは guard 内で `navigate()` を手動で呼ぶ必要がある
2. **async guard 評価中は空表示** — ローディング表示の組み込みはない。UX を考えると sync guard + 手動リダイレクトの方が実用的
3. **refetchInterval はデータ更新のみ、UI 通知なし** — SlotRef ポーリングで補完するパターンが必要。reactive プラグインがあれば Signal 連携で解決できるが、base のみの構成では明示的なポーリングになる
4. **`resource.peek()` の使い分け** — Suspense 内では `resource()` で自動サスペンド、ポーリング更新時は `peek()` + try/catch で安全にデータ取得

## 起動

```bash
pnpm dev
```
