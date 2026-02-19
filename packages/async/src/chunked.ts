/**
 * chunked spell
 *
 * Splits a large list into chunks and renders them incrementally.
 * The first chunk is rendered synchronously; remaining chunks are
 * deferred via a scheduler callback (requestIdleCallback by default).
 */

import type { Tagged, Spell, Render } from "@ydant/core";

/** A chunked rendering request. */
export type ChunkedRequest = Tagged<
  "chunked",
  {
    items: readonly unknown[];
    chunkSize: number;
    each: (item: unknown, index: number) => Render;
    schedule?: (callback: () => void) => () => void;
  }
>;

/**
 * Renders a list of items in chunks, deferring later chunks to avoid
 * blocking the main thread during initial render.
 *
 * @param items - The full list to render.
 * @param chunkSize - Number of items per chunk.
 * @param each - Render function called for each item.
 * @param options - Optional custom scheduler.
 *
 * @example
 * ```typescript
 * yield* ul(function* () {
 *   yield* chunked(items, 50, function* (item) {
 *     yield* li(() => [text(item.name)]);
 *   });
 * });
 * ```
 */
export function* chunked<T>(
  items: readonly T[],
  chunkSize: number,
  each: (item: T, index: number) => Render,
  options?: { schedule?: (callback: () => void) => () => void },
): Spell<"chunked"> {
  yield {
    type: "chunked",
    items,
    chunkSize,
    each: each as (item: unknown, index: number) => Render,
    schedule: options?.schedule,
  };
}
