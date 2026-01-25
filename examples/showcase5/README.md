# Showcase 5: Sortable List with key()

`key()` プリミティブによる効率的なリスト更新のデモ。

## 機能

- 並び替え可能なリスト
- ソート機能（ID、優先度、テキスト）
- DOM ノードの再利用

## 実装のポイント

### key() による差分更新

リスト要素に一意なキーを設定することで、DOM ノードが再利用される:

```typescript
for (const item of items) {
  yield* key(item.id);  // 次の要素にキーを関連付け
  yield* li(() => [text(item.name)]);
}
```

**利点:**
- パフォーマンス向上（DOM 再作成を回避）
- input のフォーカスやスクロール位置の保持
- アニメーションの継続

### key なしとの違い

```typescript
// key なし: ソート時にすべての li が再作成される
for (const item of items) {
  yield* li(() => [text(item.name)]);
}

// key あり: 同じ key を持つ li は DOM ノードが再利用される
for (const item of items) {
  yield* key(item.id);
  yield* li(() => [text(item.name)]);
}
```

## 実行

```bash
pnpm run dev
```
