# Showcase 18: Collaborative Editing

複数 DOM Engine の協調動作デモ。2 つの独立エディタ間の競合検出、pause/resume による制御、自動解決を実演する。

## 機能

- 2 つの独立した DOM エディタ（別々の DOM Backend / Engine）
- 同一行の同時編集による競合検出
- 競合時の Engine pause -> 自動解決 -> resume フロー
- `hub.dispatch()` による編集通知
- `engine.onError()` によるエラー隔離
- Auto-play モードによるランダム編集シミュレーション
- イベントログによる状態遷移の可視化

## 使用パッケージ

- `@ydant/core` — scope, embed, Engine, Hub 型
- `@ydant/base` — DOM Backend, 要素ファクトリ, text
- `@ydant/reactive` — signal, reactive, batch

## 実装のポイント

### DOM-to-DOM embed

Canvas ではなく DOM Backend を embed することで、メインの DOM ツリー内に独立した DOM Engine を配置する:

```typescript
// Editor A 用の DOM Backend を Slot ノード上に作成
const slotA = yield * div({ class: "editor-panel" });
const backendA = createDOMBackend(slotA.node as HTMLElement);
const builderA = scope(backendA, [createBasePlugin(), createReactivePlugin()]);
const engineA = yield * builderA.embed(() => Editor({ editor: "A" }));
```

各エディタは独立した Engine を持つため、一方の pause が他方に影響しない。

### 競合検出と pause/resume フロー

同一行を別のエディタが編集すると競合を検出し、相手の Engine を pause する:

```typescript
if (isConflict && !conflictState()) {
  conflictState.set({ lineIndex, editorA: ..., editorB: ... });

  // 相手の Engine を pause
  const otherEngine = editor === "A" ? _engineB : _engineA;
  if (otherEngine && !otherEngine.paused) {
    otherEngine.pause();
  }

  // 自動解決
  setTimeout(() => resolveConflict(lineIndex), 1500);
}
```

### batch() によるアトミック更新

競合解決時に複数の Signal をまとめて更新し、中間状態の描画を防ぐ:

```typescript
function resolveConflict(lineIndex: number) {
  batch(() => {
    const updated = [...current];
    updated[lineIndex] = { ...line, lastEditor: null };
    lines.set(updated);
    conflictState.set(null);
  });

  // pause 解除
  if (_engineB?.paused) _engineB.resume();
  if (_engineA?.paused) _engineA.resume();
}
```

### hub.dispatch() による編集通知

編集発生時に相手の Engine にメッセージを送信する:

```typescript
const targetEngine = editor === "A" ? _engineB : _engineA;
if (targetEngine) {
  hub.dispatch(targetEngine, {
    type: "edit:remote",
    editor,
    lineIndex,
    content: newContent,
  });
}
```

### engine.onError() によるエラー隔離

各 Engine のエラーを独立してハンドリングし、一方のエラーが他方に波及しないことを保証する:

```typescript
_engineA?.onError((err) => {
  appendEvent(`Engine A ERROR: ${err}`);
});
_engineB?.onError((err) => {
  appendEvent(`Engine B ERROR: ${err}`);
});
```

## 実行

```bash
pnpm run dev
```
