# Showcase 5: Sortable List with keyed()

`keyed()` ラッパーによる効率的なリスト更新のデモ。

## 機能

- 並び替え可能なリスト
- ソート機能（ID、優先度、テキスト）
- DOM ノードの再利用

## 実装のポイント

### keyed() による差分更新

リスト要素に一意なキーを設定することで、DOM ノードが再利用される:

```typescript
for (const item of items) {
  yield * keyed(item.id, li)(() => [text(item.name)]);
}
```

**利点:**

- パフォーマンス向上（DOM 再作成を回避）
- input のフォーカスやスクロール位置の保持
- アニメーションの継続

### keyed なしとの違い

```typescript
// keyed なし: ソート時にすべての li が再作成される
for (const item of items) {
  yield * li(() => [text(item.name)]);
}

// keyed あり: 同じ key を持つ li は DOM ノードが再利用される
for (const item of items) {
  yield * keyed(item.id, li)(() => [text(item.name)]);
}
```

## 実行

```bash
pnpm run dev
```
