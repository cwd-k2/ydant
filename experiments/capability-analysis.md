# 能力定義層の設計分析

> **Status: 実装完了** (2026-02)
>
> この分析で特定した問題は Capabilities システムとして実装済み。
> 以下は設計時の分析記録として残す。
>
> 実装の概要:
>
> - 能力インターフェース (`TreeCapability` 等) → `@ydant/core/src/capabilities.ts`
> - DOM 実装 → `@ydant/base/src/capabilities.ts` (`createDOMCapabilities`)
> - Canvas 実装 → `@ydant/canvas/src/capabilities.ts` (`createCanvasCapabilities`)
> - SSR 実装 → `@ydant/ssr/src/target.ts` (`createSSRCapabilities`)
> - Hydration → `ResolveCapability` + `createHydrationPlugin`
> - 型レベル効果追跡 → `@ydant/core/src/types.ts` (`CapabilityCheck`, `RequiredCapabilities`)

## 1. 問題: 現 RenderTarget の DOM バイアス

現在の `RenderTarget` は DOM API の形状をそのまま抽象化している。

```
RenderTarget = createElement + appendChild + setAttribute + addEventListener + ...
```

SSR は「addEventListener = no-op」「scheduleCallback = no-op」のように
**不要な能力を持っているが無視する**パターン。
Hydration は `createElement` を使わず代わりに `NodeResolver` が必要で、
`prepare()` は `skipPrepare` ハックで殺している。

**根本原因**: 操作の列挙であって、能力の抽象化になっていない。

---

## 2. 分析対象: レンダリングパターン一覧

| パターン            | 特徴                                      |
| ------------------- | ----------------------------------------- |
| Actual DOM          | ブラウザ描画。createElement + appendChild |
| Happy-DOM/JSDOM     | テスト用 DOM エミュレーション             |
| VNode → HTML (SSR)  | 仮想ノード → 文字列。イベントなし         |
| Streaming SSR       | 逐次 HTML 出力                            |
| Hydration           | 既存 DOM にイベント接続                   |
| Partial Hydration   | 一部だけ hydrate (Islands)                |
| Resumability (Qwik) | シリアライズ状態から再開                  |
| Canvas 2D / WebGL   | 描画コマンド列                            |
| Terminal UI         | ANSI エスケープ                           |
| Virtual DOM (React) | 差分計算 + パッチ                         |
| Mock/Spy target     | 操作記録のみ                              |
| Snapshot target     | ツリーの JSON 表現                        |

---

## 3. 操作の分類マトリクス

各パターンが **実際に行う操作** を比較:

```
                 ノード生成   親子構築   属性設定   イベント接続   スケジュール   既存取得
DOM               ✓           ✓          ✓          ✓             ✓
SSR (VNode)       ✓           ✓          ✓
Hydration                                           ✓             ✓             ✓
Canvas            (context)              (style)    ✓(hitTest)    ✓
Terminal UI       ✓           ✓          ✓          ✓             ✓
React VDOM        ✓           ✓          ✓          ✓             ✓             (reconciler)
Mock/Spy          ✓(記録)     ✓(記録)    ✓(記録)    ✓(記録)       ✓(記録)
Snapshot          ✓           ✓          ✓
```

---

## 4. 能力の分割基準

1. **独立存在**: その能力だけで意味のあるバックエンドが成り立つか
2. **同時使用**: 常にペアの操作は分離しない (create + append → 常にセット)
3. **排他代替**: 同じ目的を異なる手段で達成 (create vs resolve → 別能力)

---

## 5. 提案: 5 能力 + 1 基盤

### 基盤 (全バックエンド必須)

```typescript
interface NodeIdentity {
  isElement(node: unknown): boolean;
}
```

Core が RenderContext 初期化で使う。能力というより前提条件。

### 5 つの能力

```typescript
/** ノードツリーの構築 — ノードを生成し、木構造を組み立てる */
interface TreeCapability {
  createElement(tag: string): unknown;
  createElementNS(ns: string, tag: string): unknown;
  createTextNode(content: string): unknown;
  appendChild(parent: unknown, child: unknown): void;
  removeChild(parent: unknown, child: unknown): void;
  clearChildren(parent: unknown): void;
  prepare(): void; // ツリー構築の前準備
}

/** ノードの性質付与 — 属性を設定する */
interface DecorateCapability {
  setAttribute(node: unknown, key: string, value: string): void;
}

/** イベント応答 — 外部入力に反応する */
interface InteractCapability {
  addEventListener(node: unknown, type: string, handler: (e: unknown) => void): void;
}

/** 非同期制御 — コールバックをスケジュールする */
interface ScheduleCapability {
  scheduleCallback(callback: () => void): void;
}

/** 既存ノード取得 — すでに存在するノードを見つける */
interface ResolveCapability {
  nextChild(parent: unknown): unknown | null;
}
```

### 各バックエンドの能力プロファイル

```
              Tree  Decorate  Interact  Schedule  Resolve
────────────────────────────────────────────────────────
DOM            ✓      ✓         ✓         ✓
SSR            ✓      ✓
Hydration                       ✓         ✓         ✓
Canvas                          ✓(*)      ✓
Terminal       ✓      ✓         ✓         ✓
Test/Mock      ✓      ✓         ✓         ✓
Snapshot       ✓      ✓
```

### 重要な分離の根拠

**Tree vs Resolve** — 排他的代替
: 同じ「ノードをコンテキストに導入する」目的を、
作る (Tree) か見つける (Resolve) かの違い。
Hydration は Tree を持たず Resolve を持つ。

**Decorate vs Interact** — SSR で分離
: SSR は Decorate (setAttribute) を持つが Interact (addEventListener) を持たない。
Hydration は逆に Interact を持つが Decorate を持たない (SSR が設定済み)。

**Schedule の独立** — SSR で不要
: SSR はライフサイクルコールバックを実行しない。
scheduleCallback が no-op になるのではなく、そもそも存在しない。

---

## 6. 三層の関係: DSL → Plugin → Capability

```
DSL 層: yield* div(...)
  → 「div 要素が欲しい」(意図を宣言するだけ)

Plugin 層: Base Plugin / Hydration Plugin
  → 「div を作る方法を知っている」(戦略を決定)
  → 必要な能力を宣言: Base は Tree + Decorate、Hydration は Resolve + Interact

Capability 層: Tree / Decorate / Interact / Schedule / Resolve
  → 「具体的な操作を提供する」(primitive)
```

**DSL はどの能力が必要かを直接は知らない。**
Plugin が「この DSL をこう実現する」と決め、その実現に必要な能力を宣言する。
同じ `element` リクエストでも、Plugin によって必要な能力が異なる。

---

## 7. 型レベルの効果追跡への影響

Phase 0 の PoC で確認した
「Generator yield 型 → Request → SpellSchema → capabilities」チェーンは、
能力要件が SpellSchema に紐づく場合にのみ成立する。

しかし能力要件は Plugin に属する。そこで二段階モデル:

```
(1) DSL → Effect (SpellSchema で宣言)
    element → "structural" effect
    on      → "interactive" effect
    text    → "structural" effect

(2) Plugin + Effect → Capability (Plugin が宣言)
    Base Plugin:      structural → Tree + Decorate
    Hydration Plugin: structural → Resolve
    Base Plugin:      interactive → Interact
```

型レベルでは:

- DSL プログラムから Effect を自動抽出 (Phase 0 で実証済み)
- Plugin の登録時に Effect → Capability のマッピングを確定
- mount で required capabilities ⊆ provided capabilities を検証

---

## 8. 未解決の問い

1. **Canvas のような根本的に異なるバックエンド**: Tree の「create + append」という
   形状に合わない。Canvas 用の StructureCapability は Tree とは別物になる。
   → 能力インターフェースはバックエンドファミリーごとに異なるべき?
   → それとも更に抽象的な「context 管理」能力?

2. **React/Vue エミュレーション**: Reconciler (差分更新) は能力か Plugin か?
   → おそらく Plugin 層。React Plugin が Tree 能力を使って diff + patch する。
   → Vue Plugin が Reactive + Tree 能力を使って細粒度更新する。

3. **prepare() の帰属**: Tree 能力に含めたが、Hydration は Tree を持たず
   prepare もしない。自然な分離に見えるが、「Tree なしで prepare だけ」
   というケースが将来あるか?

4. **removeChild / clearChildren の帰属**: Slot.refresh で使う。
   SSR でも使う (VNode の再レンダリング)。Tree に含めているが、
   「既存ノードの変異」として Mutate 能力に分離すべきか?
