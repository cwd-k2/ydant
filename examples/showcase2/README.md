# Showcase 2: ToDo App

CRUD 操作と永続化を備えた ToDo アプリ。

## 機能

- タスクの追加・編集・削除・完了切り替え
- フィルタリング（All / Active / Completed）
- localStorage への永続化

## 実装のポイント

### 複数 Slot の更新

複数の UI 領域を同時に更新する場合:

```typescript
let listSlot: Slot;
let statsSlot: Slot;

// イベントハンドラ内で両方更新
const handleAdd = () => {
  todos.push(newTodo);
  listSlot.refresh(renderList);
  statsSlot.refresh(renderStats);
};
```

### localStorage 永続化

`@ydant/context` の `createStorage` を使用:

```typescript
import { createStorage } from "@ydant/context";

const todoStorage = createStorage<Todo[]>("todos", []);

// 読み取り
const todos = todoStorage.get();

// 書き込み
todoStorage.set(todos);
```

## 実行

```bash
pnpm run dev
```
