/**
 * ErrorBoundary
 *
 * Catches errors thrown by child components and displays a fallback UI.
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

import type { DSL, Render } from "@ydant/core";
import { div } from "@ydant/base";

/** Props for the ErrorBoundary component. */
export interface ErrorBoundaryProps {
  /** Component to display when an error is caught. Receives the error and a reset callback. */
  fallback: (error: Error, reset: () => void) => Render;
  /** Content that may throw errors during rendering. */
  content: () => Render;
}

/**
 * ErrorBoundary component for catching rendering errors.
 *
 * Note: In JavaScript generators, catching errors thrown at yield points
 * requires special handling. This implementation only catches synchronous errors.
 */
export function* ErrorBoundary(props: ErrorBoundaryProps): DSL<"element"> {
  const { fallback, content } = props;

  const containerSlot = yield* div(function* () {
    try {
      yield* content();
    } catch (error) {
      // Re-throw Promises so Suspense can handle them
      if (error instanceof Promise) {
        throw error;
      }

      // Error caught — display fallback
      const reset = () => {
        containerSlot.refresh(function* () {
          try {
            yield* content();
          } catch (retryError) {
            if (retryError instanceof Promise) {
              throw retryError;
            }
            yield* fallback(retryError as Error, reset);
          }
        });
      };

      yield* fallback(error as Error, reset);
    }
  });

  return containerSlot;
}
