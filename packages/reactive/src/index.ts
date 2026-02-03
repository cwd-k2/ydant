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

// Import base types to ensure module augmentation is loaded
import "@ydant/base";

// Types
export type { Subscriber } from "./types";

// Signal
export { signal } from "./signal";
export type { Signal } from "./signal";

// Computed
export { computed } from "./computed";
export type { Computed } from "./computed";

// Effect
export { effect } from "./effect";

// Batch
export { batch, scheduleEffect } from "./batch";

// Reactive primitive
export { reactive } from "./reactive";
export type { Reactive } from "./reactive";

// Plugin
export { createReactivePlugin } from "./plugin";
