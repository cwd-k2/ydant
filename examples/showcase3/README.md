# Showcase 3: Pomodoro Timer

SVG を使ったプログレスリング付きポモドーロタイマー。

## 機能

- 作業/休憩モード切り替え
- SVG プログレスリング
- タイマー状態管理

## 実装のポイント

### SVG 要素の使い方

SVG 要素は専用のファクトリ関数を使用（namespace 自動設定）:

```typescript
import { svg, circle, path } from "@ydant/core";

yield* svg(function* () {
  yield* attr("width", "240");
  yield* attr("height", "240");

  yield* circle(() => [
    attr("cx", "120"),
    attr("cy", "120"),
    attr("r", "100"),
    attr("stroke", "#e5e7eb"),
  ]);
});
```

**注意**: SVG の `<text>` 要素は `svgText` として提供（`text` プリミティブとの衝突回避）。

### ライフサイクルフック

タイマーのクリーンアップに `onMount` を使用:

```typescript
yield* onMount(() => {
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);  // クリーンアップ関数
});
```

## 実行

```bash
pnpm run dev
```
