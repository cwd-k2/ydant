# Ydant

**Y**ou **D**on't **A**ctually **N**eed **T**his - JavaScript のジェネレーターを使った DOM レンダリング DSL

[English README](./README.md)

## これは何？

Ydant は、JavaScript のジェネレーターをドメイン固有言語として使い、DOM 構造を構築する実験的な UI ライブラリです。意図的にミニマルで型破りなアプローチを取っています。ジェネレーターと DOM が出会うとき、何が可能になるかを探求する遊び場です。

```typescript
import { div, span, button, text, clss, on, type Slot } from "@ydant/core";

function Counter(initial: number) {
  let count = initial;
  let countSlot: Slot;

  return div(function* () {
    yield* clss(["counter"]);

    countSlot = yield* span(function* () {
      yield* text(`Count: ${count}`);
    });

    yield* button(function* () {
      yield* on("click", () => {
        count++;
        countSlot.refresh(() => [text(`Count: ${count}`)]);
      });
      yield* text("+1");
    });
  });
}
```

## 特徴

- **ジェネレーターベースの DSL** - `yield*` を使って DOM 要素を自然に合成
- **2つの構文** - Slot アクセスにはジェネレーター構文、静的構造には配列構文
- **シンプルな関数コンポーネント** - props を受け取りジェネレーターを返すプレーンな関数
- **Slot パターン** - 仮想 DOM の差分計算なしに細粒度の更新
- **Signal ベースのリアクティビティ** - Signal と Computed による任意のリアクティブシステム
- **プラグインアーキテクチャ** - 拡張可能なレンダラーとプラグイン機能
- **軽量** - 依存関係なし、最小限の抽象化
- **TypeScript ファースト** - Tagged Union 型による完全な型安全性

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ router   │ │ context  │ │ async    │ │transition│           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│       └────────────┴─────┬──────┴────────────┘                  │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────┐              │
│  │                    @ydant/dom                 │              │
│  │  ┌─────────────────────────────────────────┐  │              │
│  │  │            Plugin System                │  │              │
│  │  │  ┌─────────────┐  ┌─────────────────┐   │  │              │
│  │  │  │  reactive   │  │     context     │   │  │              │
│  │  │  │   plugin    │  │     plugin      │   │  │              │
│  │  │  └─────────────┘  └─────────────────┘   │  │              │
│  │  └─────────────────────────────────────────┘  │              │
│  │                                               │              │
│  │  ┌─────────────────────────────────────────┐  │              │
│  │  │           Rendering Engine              │  │              │
│  │  │  render() → processElement() → DOM      │  │              │
│  │  └─────────────────────────────────────────┘  │              │
│  └───────────────────────────────────────────────┘              │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────┐              │
│  │                  @ydant/core                  │              │
│  │  ┌─────────────┐  ┌─────────────┐             │              │
│  │  │   Types     │  │  Elements   │             │              │
│  │  │  Tagged<T>  │  │  div, span  │             │              │
│  │  │  Child      │  │  button ... │             │              │
│  │  │  Slot       │  │             │             │              │
│  │  └─────────────┘  └─────────────┘             │              │
│  │  ┌─────────────┐  ┌─────────────┐             │              │
│  │  │ Primitives  │  │  Utilities  │             │              │
│  │  │ text, attr  │  │  isTagged   │             │              │
│  │  │ on, clss    │  │  toChildren │             │              │
│  │  └─────────────┘  └─────────────┘             │              │
│  └───────────────────────────────────────────────┘              │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────┐              │
│  │                @ydant/reactive                │              │
│  │  ┌─────────────────────────────────────────┐  │              │
│  │  │  signal  │  computed  │  effect  │ batch│  │              │
│  │  └─────────────────────────────────────────┘  │              │
│  │  ┌─────────────────────────────────────────┐  │              │
│  │  │           tracking (internal)           │  │              │
│  │  │  getCurrentSubscriber, runWithSubscriber│  │              │
│  │  └─────────────────────────────────────────┘  │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### パッケージ依存関係

```
@ydant/core      ← 基盤（型、要素ファクトリ、プリミティブ）
       ↑
@ydant/reactive  ← リアクティビティ（signal, computed, effect）
       ↑
@ydant/dom       ← レンダリングエンジン + プラグインシステム
       ↑
       ├── @ydant/context    ← Context API（provide/inject）
       ├── @ydant/router     ← SPA ルーティング
       ├── @ydant/async      ← 非同期コンポーネント
       └── @ydant/transition ← CSS トランジション
```

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

const App: Component = () =>
  div(() => [
    clss(["app"]),
    text("Hello, Ydant!"),
  ]);

mount(App, document.getElementById("root")!);
```

## 構文オプション

### ジェネレーター構文

更新用の `Slot` や DOM アクセスが必要な場合に使用：

```typescript
div(function* () {
  yield* clss(["container"]);

  const { refresh, node } = yield* p(function* () {
    yield* text("動的コンテンツ");
  });

  // 後で: refresh(() => [text("更新されました！")]);
  // DOM アクセス: node.scrollIntoView();
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

コンポーネントは props を受け取りジェネレーターを返すシンプルな関数です：

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

function Button(props: ButtonProps) {
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

### プリミティブ（@ydant/core）

| 関数 | 説明 |
|------|------|
| `text(content)` | テキストノードを作成 |
| `attr(key, value)` | HTML 属性を設定 |
| `clss(classes[])` | class 属性を設定（ショートハンド） |
| `on(event, handler)` | イベントリスナーを追加 |
| `tap(callback)` | DOM 要素への直接アクセス |
| `style(styles)` | インラインスタイルを設定 |
| `key(value)` | リスト差分用のキーを設定 |
| `onMount(callback)` | マウント時のライフサイクルフック |
| `onUnmount(callback)` | アンマウント時のライフサイクルフック |

### 要素

標準的な HTML 要素がすべて利用可能：`div`, `span`, `p`, `button`, `input`, `h1`-`h6`, `ul`, `li`, `a`, `form`, `table` など

SVG 要素も利用可能：`svg`, `circle`, `path`, `rect`, `g` など

### マウント（@ydant/dom）

| 関数 | 説明 |
|------|------|
| `mount(component, element, options?)` | コンポーネントを DOM 要素にマウント |

オプションにはレンダラーを拡張するための `plugins` が含まれます。

### リアクティビティ（@ydant/reactive）

| 関数 | 説明 |
|------|------|
| `signal(value)` | リアクティブな Signal を作成 |
| `computed(fn)` | 派生値を作成 |
| `effect(fn)` | Signal 変更時に副作用を実行 |
| `reactive(fn)` | Signal 変更時に DOM を自動更新 |

### トランジション（@ydant/transition）

| 関数 | 説明 |
|------|------|
| `Transition(props)` | 表示/非表示の enter トランジション |
| `createTransition(props)` | enter + leave アニメーション完全サポート |
| `TransitionGroup(props)` | リストアイテムのトランジション |

**createTransition** はプログラム制御用のハンドルを返します：

```typescript
const transition = yield* createTransition({
  enter: "fade-enter",
  enterFrom: "opacity-0",
  enterTo: "opacity-100",
  leave: "fade-leave",
  leaveFrom: "opacity-100",
  leaveTo: "opacity-0",
  children: () => div(() => [text("Content")]),
});

// enter アニメーションで表示
await transition.setShow(true);

// leave アニメーションで非表示
await transition.setShow(false);
```

### 型ガード

| 関数 | 説明 |
|------|------|
| `isTagged(value, tag)` | 値が指定された type タグを持つか確認 |

## パッケージ

| パッケージ | 説明 |
|------------|------|
| [@ydant/core](./packages/core) | DSL、型定義、要素ファクトリ、プラグインインターフェース |
| [@ydant/dom](./packages/dom) | プラグインサポート付き DOM レンダリングエンジン |
| [@ydant/reactive](./packages/reactive) | リアクティビティシステム（signal, computed, effect） |
| [@ydant/context](./packages/context) | Context API と永続化ヘルパー |
| [@ydant/router](./packages/router) | SPA ルーティング（RouterView, RouterLink） |
| [@ydant/async](./packages/async) | 非同期コンポーネント（Suspense, ErrorBoundary） |
| [@ydant/transition](./packages/transition) | CSS トランジション（Transition, TransitionGroup） |

## プロジェクト構造

```
packages/
├── core/        # DSL、型定義、要素ファクトリ、プラグインインターフェース
├── dom/         # プラグインサポート付き DOM レンダリングエンジン
├── reactive/    # リアクティビティシステム（signal, computed, effect）
├── context/     # Context API と永続化ヘルパー
├── router/      # SPA ルーティング
├── async/       # 非同期コンポーネント（Suspense, ErrorBoundary）
└── transition/  # CSS トランジション

examples/
├── showcase1/   # カウンター、ダイアログコンポーネント
├── showcase2/   # ToDo アプリ（CRUD、localStorage）
├── showcase3/   # ポモドーロタイマー（SVG）
├── showcase4/   # SPA とプラグインアーキテクチャ
├── showcase5/   # key() を使ったソート可能リスト
├── showcase6/   # 非同期（Suspense, ErrorBoundary）
└── showcase7/   # CSS トランジション
```

## 実装例

Ydant の動作を確認できるサンプルを用意しています：

| サンプル | 説明 | 主な機能 |
|----------|------|----------|
| [showcase1](./examples/showcase1/) | 基本デモ | Slot を使ったカウンター、ダイアログコンポーネント |
| [showcase2](./examples/showcase2/) | ToDo アプリ | CRUD 操作、localStorage への永続化、フィルタリング |
| [showcase3](./examples/showcase3/) | ポモドーロタイマー | タイマー状態管理、SVG プログレスリング、モード切り替え |
| [showcase4](./examples/showcase4/) | SPA デモ | Router、Context、Reactive、プラグインアーキテクチャ |
| [showcase5](./examples/showcase5/) | ソート可能リスト | key() による効率的なリスト更新 |
| [showcase6](./examples/showcase6/) | 非同期デモ | Suspense、ErrorBoundary、createResource |
| [showcase7](./examples/showcase7/) | トランジション | Fade、Slide、Toast と CSS トランジション |

サンプルを実行するには：

```bash
cd examples/showcase1  # または showcase2, ..., showcase7
pnpm run dev
```

## 開発

```bash
# 依存関係のインストール
pnpm install

# 全パッケージのビルド
pnpm -r run build

# 統合 dev サーバーを起動（全サンプル）
pnpm run dev

# または個別サンプルを実行
cd examples/showcase1
pnpm run dev

# テスト実行
pnpm test          # watch モード
pnpm test:run      # 単発実行
pnpm test:coverage # カバレッジレポート付き
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
