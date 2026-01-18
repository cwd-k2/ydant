# Ydant

**Y**ou **D**on't **A**ctually **N**eed **T**his - JavaScript のジェネレーターを使った DOM レンダリング DSL

[English README](./README.md)

## これは何？

Ydant は、JavaScript のジェネレーターをドメイン固有言語として使い、DOM 構造を構築する実験的な UI ライブラリです。意図的にミニマルで型破りなアプローチを取っています。ジェネレーターと DOM が出会うとき、何が可能になるかを探求する遊び場です。

```typescript
import { div, span, button, text, clss, on, type Component } from "@ydant/core";

function* Counter(initial: number): Component {
  let count = initial;

  yield* div(function* () {
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

  return (() => {}) as never;
}
```

## 特徴

- **ジェネレーターベースの DSL** - `yield*` を使って DOM 要素を自然に合成
- **2つの構文** - リアクティブ更新にはジェネレーター構文、静的構造には配列構文
- **シンプルな関数コンポーネント** - props を受け取り `Component` を返すプレーンな関数
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
import { div, text, clss, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";

function* App(): Component {
  yield* div(() => [
    clss(["app"]),
    text("Hello, Ydant!"),
  ]);
  return (() => {}) as never;
}

mount(App(), document.getElementById("root")!);
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

コンポーネントは props を受け取り `Component` を返すシンプルな関数です：

```typescript
import { type Component } from "@ydant/core";

interface ButtonProps {
  label: string;
  onClick: () => void;
}

function Button(props: ButtonProps): Component {
  const { label, onClick } = props;

  return button(() => [
    clss(["btn"]),
    on("click", onClick),
    text(label),
  ]);
}
```

関数を呼び出して結果を yield することでコンポーネントを使用：

```typescript
yield* Button({
  label: "クリック",
  onClick: () => alert("クリックされました！"),
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
| `tap(callback)` | DOM 要素への直接アクセス |

### 要素

標準的な HTML 要素がすべて利用可能：`div`, `span`, `p`, `button`, `input`, `h1`-`h3`, `ul`, `li`, `a`, `form`, `table` など

SVG 要素も利用可能：`svg`, `circle`, `path`, `rect`, `g` など

### マウント

| 関数 | 説明 |
|------|------|
| `mount(component, element)` | コンポーネントを DOM 要素にマウント |

### 型ガード

| 関数 | 説明 |
|------|------|
| `isTagged(value, tag)` | 値が指定された type タグを持つか確認 |

## プロジェクト構造

```
packages/
├── core/        # DSL、型定義、要素ファクトリ
└── dom/         # DOM レンダリングエンジン

examples/
├── showcase1/   # カウンター、ダイアログコンポーネント
├── showcase2/   # ToDo アプリ
└── showcase3/   # ポモドーロタイマー
```

## 実装例

Ydant の動作を確認できるサンプルを用意しています：

| サンプル | 説明 | 主な機能 |
|----------|------|----------|
| [showcase1](./examples/showcase1/) | 基本デモ | Refresher を使ったカウンター、ダイアログコンポーネント |
| [showcase2](./examples/showcase2/) | ToDo アプリ | CRUD 操作、localStorage への永続化、フィルタリング |
| [showcase3](./examples/showcase3/) | ポモドーロタイマー | タイマー状態管理、SVG プログレスリング、モード切り替え |

サンプルを実行するには：

```bash
cd examples/showcase1  # または showcase2, showcase3
pnpm run dev
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
