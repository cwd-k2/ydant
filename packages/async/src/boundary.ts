/**
 * boundary spell
 *
 * Registers an error handler on the current RenderContext.
 * Used by ErrorBoundary and Suspense to catch errors from
 * async render updates (e.g., reactive re-renders).
 */

import type { Tagged, Spell } from "@ydant/core";

/** A boundary request that registers an error handler. */
export type Boundary = Tagged<"boundary", { handler: (error: unknown) => boolean }>;

/**
 * Registers an error handler for the current rendering scope.
 *
 * The handler receives errors thrown during async render updates
 * (e.g., reactive re-renders). Return `true` to indicate the error
 * was handled, or `false` to propagate to the parent boundary.
 */
export function* boundary(handler: (error: unknown) => boolean): Spell<"boundary"> {
  yield { type: "boundary", handler };
}
