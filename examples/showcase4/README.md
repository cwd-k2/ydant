# Showcase 4: SPA Demo

Router, Context, Reactive プラグインを組み合わせた SPA デモ。

## 機能

- ページルーティング（Home, Users, User Detail, Contact, 404）
- テーマ切り替え（localStorage 永続化）
- リアクティブなユーザーリスト
- フォームバリデーション

## 実装のポイント

### プラグインの登録

複数プラグインを mount 時に登録:

```typescript
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";

mount(App, root, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
```

### Router の使い方

```typescript
import { RouterView, RouterLink, useRoute, navigate } from "@ydant/router";

// ルート定義
yield *
  RouterView({
    routes: [
      { path: "/", component: HomePage },
      { path: "/users/:id", component: UserDetailPage },
      { path: "*", component: NotFoundPage },
    ],
  });

// パラメータ取得
const route = useRoute();
const userId = route.params.id;

// プログラムナビゲーション
navigate("/users/123");
```

### Tailwind CDN でダークモード

`class` 戦略を設定する必要がある:

```html
<script>
  tailwind.config = { darkMode: "class" };
</script>
```

## 実行

```bash
pnpm run dev
```
