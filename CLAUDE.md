# Ydant - Generator-based DOM Rendering DSL

## Overview

Ydant は JavaScript ジェネレーターを DSL として使用する軽量 DOM レンダリングライブラリ。シンプルな関数ベースのコンポジションで UI コンポーネントを構築する。

**詳細な API ドキュメントは各パッケージの README を参照。**

## Project Structure

```
ydant/
├── packages/
│   ├── core/          # DSL, types, element factories
│   ├── dom/           # DOM rendering engine, plugin system
│   ├── reactive/      # Reactivity (signal, computed, effect)
│   ├── context/       # Context API, persistence
│   ├── router/        # SPA routing
│   ├── async/         # Suspense, ErrorBoundary
│   └── transition/    # CSS transitions
├── examples/
│   └── showcase1-7/   # Demo applications
├── README.md          # English documentation
├── README.ja.md       # Japanese documentation
└── CLAUDE.md          # Development guide (this file)
```

## Package Dependencies

```
@ydant/core      ← Foundation (types, elements, primitives)
       ↑
@ydant/reactive  ← Reactivity (signal, computed, effect)
       ↑
@ydant/dom       ← Rendering engine + plugin system
       ↑
       ├── @ydant/context    ← Context API
       ├── @ydant/router     ← SPA routing
       ├── @ydant/async      ← Async components
       └── @ydant/transition ← CSS transitions
```

## Commands

```bash
pnpm install              # Install dependencies
pnpm -r run build         # Build all packages
pnpm run dev              # Unified dev server (http://localhost:5173)
pnpm test                 # Run tests (watch mode)
pnpm test:run             # Run tests (single run)
pnpm test:coverage        # Run tests with coverage (93%+)
pnpm tsc --noEmit         # Type check
```

## Core Concepts

### Generator-based DSL

2つの構文をサポート:

```typescript
// Generator syntax - Slot が必要な場合
const { refresh, node } = yield* div(function* () {
  yield* clss(["container"]);
  yield* text("Content");
});

// Array syntax - 静的構造用
yield* div(() => [clss(["container"]), text("Content")]);
```

### Component & Slot

```typescript
import { type Component, type Slot, div, text, button, on } from "@ydant/core";
import { mount } from "@ydant/dom";

const Counter: Component = () => {
  let count = 0;
  let countSlot: Slot;

  return div(function* () {
    yield* button(function* () {
      yield* on("click", () => {
        count++;
        countSlot.refresh(() => [text(`Count: ${count}`)]);
      });
      yield* text("+1");
    });

    countSlot = yield* div(() => [text(`Count: ${count}`)]);
  });
};

mount(Counter, document.getElementById("app")!);
```

**重要パターン**: Slot 変数は先に宣言し、イベントハンドラ内で使用する。

### Plugin System

```typescript
import { mount } from "@ydant/dom";
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";

mount(App, root, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
```

## Design Decisions

1. **Simple function components** - props を受け取りジェネレーターを返すプレーン関数
2. **Generator for Slot** - 再レンダリングや DOM アクセスが必要な場合はジェネレーター構文
3. **Array for static** - 静的構造には配列構文
4. **Modular packages** - 機能ごとに独立したパッケージ
5. **Signal-based reactivity** - SolidJS/Preact Signals に影響を受けた設計
6. **Plugin architecture** - DOM renderer はプラグインで拡張可能
7. **JS syntax preferred** - 条件分岐やループは JS の `if`/`for` を直接使用

## Development Notes

- `@ydant/dev` condition で開発時はソース `.ts` を直接参照
- Production は `dist/` を使用
- Vite で dev server と build を処理
- pnpm workspaces でモノレポ管理

## Key Implementation Patterns

### Slot.refresh() の使い方

```typescript
// ✅ コンテンツを返す関数を渡す
slot.refresh(() => [text(`Count: ${count}`)]);

// ❌ 引数なしは不可
slot.refresh();
```

### ライフサイクル

```typescript
yield* onMount(() => {
  const timer = setInterval(() => console.log("tick"), 1000);
  return () => clearInterval(timer);  // クリーンアップ
});
```

### key による差分更新

```typescript
for (const item of items) {
  yield* key(item.id);  // DOM ノード再利用のためのキー
  yield* li(() => [text(item.name)]);
}
```

---

## Documentation Guidelines

### ドキュメント構成

| ファイル | 役割 |
|----------|------|
| `README.md` | プロジェクト概要、API リファレンス、使用例（英語） |
| `README.ja.md` | 日本語版 README（内容は英語版と同期） |
| `packages/*/README.md` | 各パッケージの詳細な API ドキュメント |
| `CLAUDE.md` | 開発ガイド、実装パターン、設計判断（このファイル） |

### README 同期の原則

**日本語・英語の README は常に同期すること。**

- 一方を更新したら、必ず他方も更新する
- 内容の差異は許容しない（翻訳の質の差は許容）
- API 表、コード例、セクション構成を一致させる

### CLAUDE.md の管理原則

**CLAUDE.md は適切なサイズに保つこと。**

1. **コンパクトに保つ**: 詳細な API ドキュメントは各パッケージ README に委ねる
2. **開発者向け**: IDE 操作方法や基本的な Git コマンドは記載しない
3. **実装知見を記録**: つまずきやすいポイント、解決パターンを追記する
4. **設計判断を文書化**: なぜそうなっているかを残す

### ストック情報とフロー情報

**ストック情報（コミット対象）:**
- `CLAUDE.md` - 確定した設計決定、実装パターン
- `README.md` / `README.ja.md` - ユーザー向けドキュメント
- `packages/*/README.md` - パッケージ API ドキュメント

**フロー情報（コミット対象外）:**
- `MEMO.md` - 一時的な検討メモ
- `FEATURE-PLAN.md` - 検討中の機能案
- `IMPLEMENTATION-PLAN.md` - 実装作業中の計画

### 情報の配置基準

| 情報の種類 | 配置先 |
|-----------|--------|
| パッケージの API、使用例 | `packages/*/README.md` |
| プロジェクト概要、機能一覧 | `README.md` / `README.ja.md` |
| 開発コマンド、構造 | `CLAUDE.md` |
| 実装パターン、設計判断 | `CLAUDE.md` |
| つまずきポイント、知見 | `CLAUDE.md` |

---

## For Future Contributors

### タスク完了時の知見記録

実装タスクを完了した際は、以下を CLAUDE.md に追記すること:

1. **つまずいたポイント**: 遭遇したエラーや問題
2. **解決パターン**: 問題をどのように解決したか
3. **推奨パターン**: 今後の実装で使うべきパターン

### 新しい showcase の追加方法

1. `examples/showcaseN/` を作成
2. `showcase1` から `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` をコピー
3. `package.json` の name を変更
4. ルートで `pnpm install`
5. `pnpm run dev` で確認

---

## Known Patterns & Gotchas

### Router のパスパラメータ実装

`:param` を正規表現に変換する際、エスケープ順序に注意:

```typescript
// ✅ プレースホルダーを使用
const placeholder = "___PARAM___";
const withPlaceholders = pattern.replace(/:([^/]+)/g, placeholder);
const escaped = withPlaceholders.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const regex = escaped.replace(/___PARAM___/g, "([^/]+)");
```

### Tailwind CDN でダークモード

```html
<script>
  tailwind.config = { darkMode: 'class' }
</script>
```

### SVG の text 要素

`text` プリミティブとの衝突を避けるため、SVG の `<text>` は `svgText` として提供。
