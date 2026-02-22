/// <reference path="./global.d.ts" />
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

// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

// ─── Types ───
export type { Readable } from "./types";
export type { Signal } from "./signal";
export type { Computed } from "./computed";
export type { Reactive } from "./reactive";
export type { ReactiveScope } from "./scope";

// ─── Runtime ───
export { signal } from "./signal";
export { computed } from "./computed";
export { effect } from "./effect";
export { batch } from "./batch";
export { reactive } from "./reactive";

// ─── Plugin ───
export { createReactivePlugin } from "./plugin";
