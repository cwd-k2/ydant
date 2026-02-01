/**
 * Reactive プリミティブ: Signal を追跡して自動更新
 *
 * @example
 * ```typescript
 * import { signal } from "@ydant/reactive";
 * import { reactive } from "@ydant/reactive";
 *
 * const count = signal(0);
 *
 * const Counter: Component = () =>
 *   div(function* () {
 *     // reactive 内の Signal アクセスを追跡
 *     // count が変わると自動で再レンダリング
 *     yield* reactive(() => [
 *       text(`Count: ${count()}`),
 *     ]);
 *
 *     yield* button(() => [
 *       on("click", () => count.update(n => n + 1)),
 *       text("Increment"),
 *     ]);
 *   });
 * ```
 */

import type { Tagged, Builder } from "@ydant/core";

/** リアクティブブロック - Signal の変更を追跡して自動更新 */
export type Reactive = Tagged<"reactive", { builder: Builder }>;

/**
 * Signal を追跡して自動的に再レンダリングするリアクティブブロックを作成
 *
 * @param builder - 子要素を生成する関数
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const doubled = computed(() => count() * 2);
 *
 * yield* reactive(() => [
 *   text(`Count: ${count()}, Doubled: ${doubled()}`),
 * ]);
 * ```
 */
export function* reactive(builder: Builder): Generator<Reactive, void, void> {
  yield { type: "reactive", builder };
}
