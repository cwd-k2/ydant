/**
 * ErrorBoundary
 *
 * Catches errors thrown by child components and displays a fallback UI.
 * Handles both synchronous errors (via try-catch in the generator) and
 * asynchronous errors (via boundary spell for reactive update errors).
 *
 * @example
 * ```typescript
 * yield* ErrorBoundary({
 *   fallback: (error, reset) => div(function* () {
 *     yield* h2(() => [text("Something went wrong")]);
 *     yield* p(() => [text(error.message)]);
 *     yield* button(() => [on("click", reset), text("Try again")]);
 *   }),
 *   content: function* () {
 *     yield* RiskyComponent();
 *   },
 * });
 * ```
 */

import type { Spell, Render } from "@ydant/core";
import { div, refresh } from "@ydant/base";
import { boundary } from "./boundary";

/** Props for the ErrorBoundary component. */
export interface ErrorBoundaryProps {
  /** Component to display when an error is caught. Receives the error and a reset callback. */
  fallback: (error: Error, reset: () => void) => Render;
  /**
   * Content that may throw errors during rendering.
   *
   * Must return a `Render` generator (not `Builder`) because it is evaluated
   * inside a try-catch boundary via `yield*`.
   */
  content: () => Render;
}

/**
 * ErrorBoundary component for catching rendering errors.
 *
 * Catches both synchronous errors (thrown during initial render) and
 * asynchronous errors (thrown during reactive updates) via the boundary spell.
 */
export function* ErrorBoundary(props: ErrorBoundaryProps): Spell<"element"> {
  const { fallback, content } = props;

  const containerSlot = yield* div(function* () {
    const reset = () => refresh(containerSlot, renderWithBoundary);

    const errorHandler = (error: unknown): boolean => {
      // Let Suspense handle Promises
      if (error instanceof Promise) return false;

      try {
        refresh(containerSlot, function* () {
          yield* boundary(errorHandler);
          yield* fallback(error as Error, reset);
        });
      } catch (fallbackError) {
        console.warn("[ErrorBoundary] Fallback render failed:", fallbackError);
        return false;
      }
      return true;
    };

    function* renderWithBoundary() {
      yield* boundary(errorHandler);
      try {
        yield* content();
      } catch (error) {
        // Re-throw Promises so Suspense can handle them
        if (error instanceof Promise) throw error;
        yield* fallback(error as Error, reset);
      }
    }

    yield* renderWithBoundary();
  });

  return containerSlot;
}
