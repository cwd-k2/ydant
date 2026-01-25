# Showcase 6: Async Demo

Suspense, ErrorBoundary, createResource による非同期データフェッチングのデモ。

## 機能

- Suspense によるローディング状態管理
- ErrorBoundary によるエラーハンドリング
- createResource による非同期データフェッチング

## 実装のポイント

### createResource の使い方

```typescript
import { createResource } from "@ydant/async";

const userResource = createResource(() => fetchUser(userId));

// 状態に応じた表示
if (userResource.loading) {
  yield * LoadingSpinner();
} else if (userResource.error) {
  yield * ErrorDisplay({ error: userResource.error });
} else {
  yield * UserCard({ user: userResource.data });
}

// 再取得
userResource.refetch();
```

### Suspense と ErrorBoundary

```typescript
import { Suspense, ErrorBoundary } from "@ydant/async";

yield *
  ErrorBoundary({
    fallback: (error) => ErrorDisplay({ error }),
    children: () =>
      Suspense({
        fallback: () => LoadingSpinner(),
        children: () => AsyncContent(),
      }),
  });
```

## 実行

```bash
pnpm run dev
```
