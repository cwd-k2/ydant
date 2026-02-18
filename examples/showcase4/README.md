# Showcase 4: SPA Demo

Router, Context, Reactive プラグインを組み合わせた SPA デモ。

## 機能

- ページルーティング（Home, Users, User Detail, Contact, 404）
- テーマ切り替え（localStorage 永続化）
- リアクティブなユーザーリスト
- フォームバリデーション

## 実装のポイント

### プラグインの登録

複数プラグインを `scope()` で登録:

```typescript
import { scope } from "@ydant/core";
import { createBasePlugin, createDOMBackend } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";

scope(createDOMBackend(root), [
  createBasePlugin(),
  createReactivePlugin(),
  createContextPlugin(),
]).mount(App);
```

Router コンポーネント（RouterView, RouterLink）は base プリミティブ上に構築されているため、プラグイン登録不要で動作する。

### Router の使い方

```typescript
import type { RouteComponentProps } from "@ydant/router";
import { RouterView, RouterLink, navigate } from "@ydant/router";

// ルート定義
yield *
  RouterView({
    routes: [
      { path: "/", component: HomePage },
      { path: "/users/:id", component: UserDetailPage },
      { path: "*", component: NotFoundPage },
    ],
  });

// パラメータ取得（ルートコンポーネントの props 経由）
const UserDetailPage: Component<RouteComponentProps> = ({ params }) => {
  const userId = params.id;
  // ...
};

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
