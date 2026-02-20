# Ydant

**Y**ou **D**on't **A**ctually **N**eed **T**his - JavaScript のジェネレーターを使った DOM レンダリング DSL

[English README](./README.md)

## これは何？

Ydant は、JavaScript のジェネレーターをドメイン固有言語として使い、DOM 構造を構築する実験的な UI ライブラリです。意図的にミニマルで型破りなアプローチを取っています。ジェネレーターと DOM が出会うとき、何が可能になるかを探求する遊び場です。

```typescript
import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin, div, button, text, type Slot } from "@ydant/base";

function Counter(initial: number) {
  let count = initial;
  let countSlot: Slot;

  return div({ class: "counter" }, function* () {
    countSlot = yield* div(() => [text(`Count: ${count}`)]);

    yield* button(
      {
        onClick: () => {
          count++;
          countSlot.refresh(() => [text(`Count: ${count}`)]);
        },
      },
      "+1",
    );
  });
}

scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()]).mount(() =>
  Counter(0),
);
```

## 特徴

- **ジェネレーターベースの DSL** - `yield*` を使って DOM 要素を自然に合成
- **2つの構文** - Slot アクセスにはジェネレーター構文、静的構造には配列構文
- **シンプルな関数コンポーネント** - props を受け取りジェネレーターを返すプレーンな関数
- **Slot パターン** - 仮想 DOM の差分計算なしに細粒度の更新
- **プラグインアーキテクチャ** - Signal、Context などで拡張可能なレンダラー
- **軽量** - 依存関係なし、最小限の抽象化
- **TypeScript ファースト** - Tagged Union 型による完全な型安全性

## パッケージ

| パッケージ            | 説明                                     | README                                  |
| --------------------- | ---------------------------------------- | --------------------------------------- |
| **@ydant/core**       | レンダリングエンジン、プラグインシステム | [詳細](./packages/core/README.md)       |
| **@ydant/base**       | 要素ファクトリ、プリミティブ、Slot       | [詳細](./packages/base/README.md)       |
| **@ydant/reactive**   | Signal ベースのリアクティビティ          | [詳細](./packages/reactive/README.md)   |
| **@ydant/context**    | Context API                              | [詳細](./packages/context/README.md)    |
| **@ydant/router**     | SPA ルーティング                         | [詳細](./packages/router/README.md)     |
| **@ydant/async**      | Suspense、ErrorBoundary                  | [詳細](./packages/async/README.md)      |
| **@ydant/transition** | CSS トランジション                       | [詳細](./packages/transition/README.md) |
| **@ydant/canvas**     | Canvas2D レンダリング                    | [詳細](./packages/canvas/README.md)     |
| **@ydant/portal**     | 別ターゲットへのレンダリング             | [詳細](./packages/portal/README.md)     |
| **@ydant/ssr**        | サーバーサイドレンダリング + Hydration   | [詳細](./packages/ssr/README.md)        |

## クイックスタート

```typescript
import { mount, div, p, type Component } from "@ydant/base";

const App: Component = () =>
  div({ class: "app" }, function* () {
    yield* p("Hello, Ydant!");
  });

mount("#root", App);
```

### プラグインを使用

```typescript
import { mount, div, button, type Component } from "@ydant/base";
import { createReactivePlugin, signal, reactive } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";

const count = signal(0);

const App: Component = () =>
  div(function* () {
    yield* reactive(() => [div(`Count: ${count()}`)]);
    yield* button({ onClick: () => count.update((n) => n + 1) }, "+1");
  });

mount("#root", App, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
```

> Canvas、SSR、embed など高度なユースケースには `@ydant/core` の `scope()` を直接使用してください。

## 実装例

| サンプル                             | 説明                                             |
| ------------------------------------ | ------------------------------------------------ |
| [showcase1](./examples/showcase1/)   | カウンター、ダイアログ - 基本的な Slot の使い方  |
| [showcase2](./examples/showcase2/)   | ToDo アプリ - CRUD、localStorage                 |
| [showcase3](./examples/showcase3/)   | ポモドーロタイマー - SVG、ライフサイクル         |
| [showcase4](./examples/showcase4/)   | SPA - Router、Context、プラグイン                |
| [showcase5](./examples/showcase5/)   | ソート可能リスト - keyed() による効率的な更新    |
| [showcase6](./examples/showcase6/)   | 非同期 - Suspense、ErrorBoundary                 |
| [showcase7](./examples/showcase7/)   | トランジション - enter/leave アニメーション      |
| [showcase9](./examples/showcase9/)   | 管理ダッシュボード - Router、認証、Context       |
| [showcase10](./examples/showcase10/) | フォームバリデーション - 動的ルール              |
| [showcase11](./examples/showcase11/) | Canvas embed - DOM + Canvas2D ハイブリッド       |
| [showcase12](./examples/showcase12/) | ポータル（モーダルダイアログ）                   |
| [showcase13](./examples/showcase13/) | SSR + Hydration                                  |
| [showcase14](./examples/showcase14/) | Reactive Canvas - Signal 駆動の再描画            |
| [showcase15](./examples/showcase15/) | マルチターゲット ダッシュボード (DOM/Canvas/SSR) |
| [showcase16](./examples/showcase16/) | 優先度ベースレンダリング - Engine 制御           |
| [showcase17](./examples/showcase17/) | Engine 間メッセージング (Hub)                    |
| [showcase18](./examples/showcase18/) | マルチ Engine 協調編集                           |

各サンプルには実装のヒントを含む README があります。全サンプルを実行:

```bash
pnpm run dev  # http://localhost:5173
```

## インストール

```bash
npm install @ydant/core @ydant/base
```

オプションパッケージ:

```bash
npm install @ydant/reactive   # Signal ベースのリアクティビティ
npm install @ydant/context    # Context API
npm install @ydant/router     # SPA ルーティング
npm install @ydant/async      # Suspense、ErrorBoundary
npm install @ydant/transition # CSS トランジション
npm install @ydant/canvas    # Canvas2D レンダリング
npm install @ydant/portal    # 別ターゲットへのレンダリング
npm install @ydant/ssr       # サーバーサイドレンダリング + Hydration
```

## 開発

```bash
git clone https://github.com/cwd-k2/ydant.git
cd ydant
pnpm install        # 依存関係のインストール
pnpm -r run build   # 全パッケージのビルド
pnpm run dev        # 統合 dev サーバーを起動
pnpm test           # テスト実行（watch モード）
pnpm test:run       # テスト実行（単発）
pnpm test:coverage  # カバレッジ付きテスト
```

## なぜ "You Don't Actually Need This"？

おそらく本当に必要ないからです。これは UI 開発への代替アプローチの実験です。本番ソフトウェアを構築するなら、React、Vue、Svelte、SolidJS を使うべきでしょう。

でも、もしあなたが以下のことに興味があるなら：

- ジェネレーターを DSL として使う方法
- 仮想 DOM なしの細粒度リアクティビティ
- DOM に対する最小限の抽象化

...ここに何か面白いものが見つかるかもしれません。

## ライセンス

MIT
