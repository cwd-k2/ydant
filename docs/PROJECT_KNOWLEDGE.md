# Ydant プロジェクト知見集

このドキュメントは Ydant プロジェクトの特性、設計思想、開発履歴をまとめたものです。

## プロジェクトの特性

### 名前の由来

**Ydant** = **Y**ou **D**on't **A**ctually **N**eed **T**his

「おそらく本当に必要ないもの」という自己言及的なユーモアを含む。これは実験的プロジェクトであり、本番環境には React/Vue/Svelte などの確立されたフレームワークを推奨している。

### 核心的なアイデア

JavaScript のジェネレーターを DSL（ドメイン固有言語）として使い、DOM 構造を宣言的に記述する。

```typescript
// ジェネレーターが yield* で DOM 命令を発行
function* () {
  yield* div(function* () {
    yield* text("Hello");
    yield* classes("container");
  });
}
```

### 設計哲学

#### core/base 分離

**@ydant/core** は「何をレンダリングするか」を知らない：

- ジェネレーターの処理
- プラグインの呼び出し
- コンテキストの管理

**@ydant/base** は「どのようにレンダリングするか」を知る：

- 要素ファクトリ（div, span, button...）
- プリミティブ（text, attr, on, classes...）
- DOM 操作、lifecycle

この分離により：

- core は小さく安定した API を維持
- base は core を変更せずに機能追加可能
- 他のプラグインは base と同じ立場で拡張可能

---

## アーキテクチャ詳細

### パッケージ依存関係

```
@ydant/core (依存なし)
    ↑
@ydant/base
    ↑
@ydant/reactive, @ydant/context
    ↑
@ydant/router, @ydant/async, @ydant/transition
```

### プラグインシステム

プラグインは以下の型を拡張できる：

| 拡張ポイント    | 用途                                      |
| --------------- | ----------------------------------------- |
| `SpellSchema`   | spell 操作定義（request/response/return） |
| `RenderContext` | コンテキストのプロパティ・メソッド        |

### Slot パターン

仮想 DOM の差分計算なしに、細粒度の DOM 更新を実現：

```typescript
let countSlot: Slot;

countSlot = yield * div(() => [text(`Count: ${count}`)]);

// 後から部分更新
countSlot.refresh(() => [text(`Count: ${newCount}`)]);
```

---

## 開発履歴

### Phase 1: 基盤構築

- ジェネレーターベースのレンダリングエンジン実装
- 基本的な要素ファクトリとプリミティブ
- mount() API の確立

### Phase 2: プラグインシステム

- プラグインアーキテクチャの設計
- @ydant/reactive（Signal ベースのリアクティビティ）
- @ydant/context（Context API）

### Phase 3: アーキテクチャ再編

- dom パッケージを core にマージ
- @ydant/base パッケージ作成
- core/base 分離の設計哲学を確立

### Phase 4: API リファクタリング

- RenderContext を拡張可能に
- Component<P> 型の統合
- createSlotRef の導入
- 型エイリアスの整備

### Phase 5: 品質改善

- CONVENTIONS.md で命名規則を文書化
- 構造整理と命名統一
- 型システムの強化
- module augmentation を global.d.ts に分離

### Phase 6: 型システム統合

- 7 つのジェネレーター型を `Spell<Key>`, `Render`, `Builder` の 3 つに統合
- `Child` → `Instruction` → `Request`, `ChildNext` → `Feedback` → `Response` にリネーム
- `ProcessResult`, `CleanupFn`, `MountOptions`, `ChildOfType` 等の薄いラッパーを廃止
- Props 命名: `children` を DOM 子要素に限定、抽象的描画関数は `content` に統一
- `toChildren` → `toRender` リネーム

### Phase 7: プラグインインターフェース統合

- `RenderAPI` を廃止し `RenderContext` に一本化
- `Plugin.extendAPI` フックを削除
- `Plugin.process` の引数を `RenderAPI` → `RenderContext` に変更
- `processChildren` と `createChildContext` をコア定義の `RenderContext` メソッドに移動
- module augmentation が `RenderContext` の 1 箇所に集約
- 拡張ポイント: `SpellSchema` + `RenderContext` の 2 つに整理

### Phase 8: 命名リファクタリング — Spell / Request / Response

- `DSLSchema` → `SpellSchema`, `DSL<Key>` → `Spell<Key>`（ユーザー向けメタファー層）
- `Instruction` → `Request`, `Feedback` → `Response`（内部の機械的な層）
- SpellSchema フィールド: `instruction` → `request`, `feedback` → `response`
- 方針: 「ユーザーに近い部分はメタファー、内部は機械的に」で層を分ける

### Phase 9: グローバル状態の排除

- **reactive**: グローバル `current` subscriber を `ReactiveScope` にスコープ化。`initContext` で mount ツリーごとに独立した追跡コンテキストを提供
- **router**: グローバル `currentRoute`/`routeListeners` を排除。`window.location` から都度導出 + DOM カスタムイベント (`ydant:route-change`) で通知
- **router**: `RouteInfo.params` を廃止し、route component の props (`RouteComponentProps`) として渡すように変更
- **router**: プラグインレスの設計を維持（base プリミティブ上のコンポーネント集）
- バッチ (`batch()`) は横断的関心事としてグローバルに維持

### Phase 10: Backend / Plugin 分離

- `Plugin` interface が Capability Provider と Processing Plugin の 2 役を兼務していた問題を解消
- 新設の `Backend` interface に Capability Provider の責務（`initContext` での能力注入、`beforeRender`、`root` 保持、phantom `__capabilities`）を移管
- `Plugin` からは `__capabilities` phantom 型パラメータと `beforeRender` フックを削除
- `mount()` シグネチャ: `{ root, plugins }` → `{ backend, plugins }` に変更
- API リネーム: `createDOMCapabilities()` → `createDOMBackend(root)`, `createCanvasCapabilities()` → `createCanvasBackend()`, `createSSRCapabilities()` → `createSSRBackend()`
- Canvas/SSR で `root` を外部から渡す必要がなくなり、参照の二重化が解消

### Phase 11: ExecutionScope と embed

- `ExecutionScope` 型を導入: backend + pluginMap + allPlugins を束ねる
- `RenderContext` から `plugins` / `allPlugins` を除去し `scope` フィールドに一本化
- `processChildren` に `{ scope }` オプションを追加 — レンダリング中の実行環境切り替え
- `embed()` spell + `createEmbedPlugin()` を core に追加（`capabilities: never`）
- `createExecutionScope()` を公開 API として export
- **processChildren の 2 種類の環境切り替え**:
  - `{ parent }` — 同じ backend、別の親ノードへ（Portal が使用）
  - `{ scope }` — 別の backend + plugins へ（embed が使用）
- **mergeChildContext は親 scope の plugins で行う**: 子の state を親に取り込む操作は親の plugins が判断すべき。子 scope 固有の plugins の mergeChildContext は呼ばれない

---

## 学んだ教訓

### TypeScript 関連

1. **module augmentation は global.d.ts に分離**
   - ビルド成果物での型参照を安定させる
   - `/// <reference types="">` で参照

2. **型定義の重複を避ける**
   - 一箇所で定義し、re-export で共有

3. **paths から customConditions へ**
   - 型解決を pnpm workspace と整合させる

4. **Spell<Key> による型の統合**
   - 以前は `Primitive<T>`, `Instruction`, `ChildContent`, `ElementRender` など用途別の型が乱立していた
   - `SpellSchema` の `request` / `response` / `return` 3 フィールドから全てを導出する設計に統合
   - `Spell<Key>` が個別操作の型、`Render` が汎用ジェネレーター型として機能
   - 中間ラッパー（`ProcessResult` 等）も不要になり、プラグインは `Response` を直接返却

5. **循環参照の解消パターン**
   - 相互参照する型は同じファイルに統合する（例: `Plugin` と `RenderContext` → `plugin.ts`）
   - 関数は唯一の使用箇所に移動する（例: `executeMount` → `element.ts`）
   - `import type` のみの循環は安全だが、型の共存関係を示すシグナルとして扱う

### 設計関連

1. **グローバル状態排除の手法は状態の「真の所有者」で選ぶ**
   - プラグインシステム内部の状態 → `initContext` で RenderContext に保持（例: reactive の subscriber tracking）
   - ブラウザ API のラッパー → ブラウザネイティブに委譲して都度導出（例: router の route info → `window.location`）
   - 横断的関心事（同期操作で全インスタンスに影響） → グローバルに維持（例: `batch()`）

2. **core は最小限に**
   - DOM の存在を仮定しない
   - プラグインに具体的処理を委ねる

3. **命名規則の一貫性**
   - `create*`: 設定・構築を伴う生成
   - `get*`: 状態取得
   - PascalCase: 内部構造を持つコンポーネント
   - lowercase: プリミティブ、ファクトリ

4. **暗黙的状態より明示的データを優先する**
   - 例: `pendingKey`（コンテキスト上の暗黙的な状態）→ `Element.key`（オブジェクトの明示的なフィールド）
   - 暗黙的状態は「先読み」「処理順序への依存」「状態のリセット忘れ」などの問題を招く
   - データが所属すべきオブジェクトに直接持たせることで、処理順序への依存がなくなり実装がシンプルになる
   - 判断基準: ある状態が「次に処理されるもの」への橋渡しだけに使われている場合、その情報は渡される先のオブジェクト自身が持つべき

---

## クイックリファレンス

### 開発コマンド

```bash
pnpm install              # 依存関係
pnpm -r run build         # 全パッケージビルド
pnpm run dev              # dev サーバー
pnpm test:run             # テスト（単発）
pnpm lint:fix             # リント + 修正
pnpm typecheck            # 型チェック
```

### ドキュメント配置

ドキュメントの配置ルール・テンプレートは **[docs/DOCUMENTATION.md](DOCUMENTATION.md)** を参照。

---

## アーキテクチャの現在地

### Capabilities システム

`RenderTarget` は廃止され、**Capabilities** システムに置き換えられた。
レンダリングバックエンドの操作を 5 つの独立した能力インターフェースに分割:

- **TreeCapability** — ノード生成・ツリー構築
- **DecorateCapability** — 属性設定
- **InteractCapability** — イベント接続
- **ScheduleCapability** — ライフサイクルコールバック
- **ResolveCapability** — 既存ノード取得（Hydration 専用）

各バックエンドは必要な能力だけを実装:

| バックエンド | Tree | Decorate | Interact | Schedule | Resolve |
| ------------ | ---- | -------- | -------- | -------- | ------- |
| DOM          | ✓    | ✓        | ✓        | ✓        |         |
| SSR          | ✓    | ✓        | no-op    | no-op    |         |
| Hydration    |      |          | ✓        | ✓        | ✓       |
| Canvas       | ✓    | ✓        | no-op    | no-op    |         |

`mount()` はコンパイル時に「Generator が必要とする能力 ⊆ Backend が提供する能力」を検証する
（`CapabilityCheck` 型、`SpellSchema` の `capabilities` フィールド、`Backend<Capabilities>` phantom 型）。

### 将来の拡張方向

- **Service 型定義**: `ServiceKey<T>`, `ServiceRegistry` を core に追加し、能力を Service 化
- **Runtime 導入**: `createRuntime()` を `mount()` のラッパーとして追加
- **Middleware**: `processIterator` に middleware chain を導入（DevTools, Logger 用）
- `Plugin.setup/teardown` の `ctx` パラメータは将来の ServiceRegistry へのアクセスパスになりうる
- `MountHandle` は拡張可能（現時点は `dispose` のみ）

---

## 関連リソース

- [CLAUDE.md](../CLAUDE.md) - 開発ガイド
- [CONVENTIONS.md](./CONVENTIONS.md) - 命名規則・コーディングパターン
- [TESTING.md](./TESTING.md) - テスト方針
- [DOCUMENTATION.md](./DOCUMENTATION.md) - ドキュメント方針
- [README.ja.md](../README.ja.md) - プロジェクト概要
