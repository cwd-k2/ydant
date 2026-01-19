/**
 * @ydant/reactive - Reactivity system for Ydant
 *
 * Signal ベースのリアクティビティシステム。
 * SolidJS / Preact Signals に影響を受けた設計。
 *
 * @example
 * ```typescript
 * import { signal, computed, effect } from "@ydant/reactive";
 *
 * // Signal: 値を保持
 * const count = signal(0);
 *
 * // Computed: 派生値
 * const doubled = computed(() => count() * 2);
 *
 * // Effect: 副作用
 * effect(() => {
 *   console.log(`Count: ${count()}, Doubled: ${doubled()}`);
 * });
 *
 * count.set(5);  // Effect が再実行される
 * ```
 */

// Signal
export { signal, runWithSubscriber, getCurrentSubscriber } from "./signal";
export type { Signal } from "./signal";

// Computed
export { computed } from "./computed";
export type { Computed } from "./computed";

// Effect
export { effect, batch, scheduleEffect } from "./effect";

// Reactive primitive
export { reactive } from "./reactive";
// Reactive 型は @ydant/core から再エクスポート
export type { Reactive } from "@ydant/core";
