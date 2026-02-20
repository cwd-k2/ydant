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
import { svg, circle, path } from "@ydant/base";

yield *
  svg.svg({ width: "240", height: "240" }, function* () {
    yield* circle({ cx: "120", cy: "120", r: "100", stroke: "#e5e7eb" });
  });
```

**注意**: SVG の `<text>` 要素は `svgText` として提供（`text` プリミティブとの衝突回避）。SVG の `<svg>` ルート要素は `svg.svg()` でアクセスする。

### ライフサイクルフック

タイマーのクリーンアップに `onMount` を使用:

```typescript
yield *
  onMount(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer); // クリーンアップ関数
  });
```

## 実行

```bash
pnpm run dev
```
