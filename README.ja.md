# Ydant

**Y**ou **D**on't **A**ctually **N**eed **T**his - JavaScript のジェネレーターを使った DOM レンダリング DSL

[English README](./README.md)

## これは何？

Ydant は、JavaScript のジェネレーターをドメイン固有言語として使い、DOM 構造を構築する実験的な UI ライブラリです。意図的にミニマルで型破りなアプローチを取っています。ジェネレーターと DOM が出会うとき、何が可能になるかを探求する遊び場です。

```typescript
const Counter = compose<{ initial: number }>(function* (inject) {
  let count = yield* inject("initial");

  return div(function* () {
    yield* clss(["counter"]);

    const refresh = yield* span(function* () {
      yield* text(`Count: ${count}`);
    });

    yield* button(function* () {
      yield* on("click", () => {
        count++;
        refresh(() => [text(`Count: ${count}`)]);
      });
      yield* text("+1");
    });
  });
});
```

## 特徴

- **ジェネレーターベースの DSL** - `yield*` を使って DOM 要素を自然に合成
- **2つの構文** - リアクティブ更新にはジェネレーター構文、静的構造には配列構文
- **コンポーネントシステム** - `inject`/`provide` による依存性注入を備えた `compose<Props>()`
- **Refresher パターン** - 仮想 DOM の差分計算なしに細粒度の更新
- **軽量** - 依存関係なし、最小限の抽象化
- **TypeScript ファースト** - Tagged Union 型による完全な型安全性

## インストール

```bash
# モノレポです - クローンしてローカルで使用してください
git clone https://github.com/your-username/ydant.git
cd ydant
pnpm install
pnpm -r run build
```

## クイックスタート

```typescript
import { compose, div, button, text, clss, on } from "@ydant/composer";
import { mount } from "@ydant/renderer";

const App = compose<{}>(function* () {
  return div(() => [
    clss(["app"]),
    text("Hello, Ydant!"),
  ]);
});

mount(App, document.getElementById("root")!);
```

## 構文オプション

### ジェネレーター構文

更新用の `Refresher` が必要な場合に使用：

```typescript
div(function* () {
  yield* clss(["container"]);

  const refresh = yield* p(function* () {
    yield* text("動的コンテンツ");
  });

  // 後で: refresh(() => [text("更新されました！")]);
});
```

### 配列構文

静的な構造に使用：

```typescript
div(() => [
  clss(["container"]),
  p(() => [text("静的コンテンツ")]),
]);
```

## コンポーネント

`compose<Props>()` でコンポーネントを定義：

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

const Button = compose<ButtonProps>(function* (inject) {
  const label = yield* inject("label");
  const onClick = yield* inject("onClick");

  return button(() => [
    clss(["btn"]),
    on("click", onClick),
    text(label),
  ]);
});
```

`provide` でコンポーネントを使用：

```typescript
yield* Button(function* (provide) {
  yield* provide("label", "クリック");
  yield* provide("onClick", () => alert("クリックされました！"));
  // ルート要素に追加の属性を付与
  yield* clss(["primary"]);
});
```

## API リファレンス

### プリミティブ

| 関数 | 説明 |
|------|------|
| `text(content)` | テキストノードを作成 |
| `attr(key, value)` | HTML 属性を設定 |
| `clss(classes[])` | class 属性を設定（ショートハンド） |
| `on(event, handler)` | イベントリスナーを追加 |

### 要素

標準的な HTML 要素がすべて利用可能：`div`, `span`, `p`, `button`, `input`, `h1`-`h3`, `ul`, `li`, `a`, `form`, `table` など

### コンポーネント

| 関数 | 説明 |
|------|------|
| `compose<T>(buildFn)` | props 型 `T` を持つコンポーネントを作成 |
| `mount(app, element)` | アプリを DOM 要素にマウント |

### 型ガード

| 関数 | 説明 |
|------|------|
| `isTagged(value, tag)` | 値が指定された type タグを持つか確認 |

## プロジェクト構造

```
packages/
├── interface/   # コア型定義
├── composer/    # コンポーネント合成 & 要素
└── renderer/    # DOM レンダリングエンジン

examples/
└── showcase1/   # デモアプリケーション
```

## 開発

```bash
# 依存関係のインストール
pnpm install

# 全パッケージのビルド
pnpm -r run build

# デモの実行
cd examples/showcase1
pnpm run dev
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
