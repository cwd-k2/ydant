/**
 * Reactive primitive — a DSL block that tracks Signal dependencies and
 * automatically re-renders when they change.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 *
 * const Counter: Component = () =>
 *   div(function* () {
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

import type { Tagged, Builder, Primitive } from "@ydant/core";

/** A DSL instruction representing a reactive block that auto-updates when its Signal dependencies change. */
export type Reactive = Tagged<"reactive", { builder: Builder }>;

/**
 * Creates a reactive rendering block. Any Signals read inside the builder
 * are tracked; when they change, the block's DOM is re-rendered automatically.
 *
 * @param builder - A function that returns rendering instructions.
 *
 * @example
 * ```typescript
 * yield* reactive(() => [
 *   text(`Count: ${count()}, Doubled: ${doubled()}`),
 * ]);
 * ```
 */
export function* reactive(builder: Builder): Primitive<Reactive> {
  yield { type: "reactive", builder };
}
