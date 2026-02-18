/**
 * Suspense
 *
 * Manages the loading state of asynchronous components.
 * Displays a fallback UI when a child component throws a Promise.
 * Handles both synchronous suspends (thrown during initial render) and
 * asynchronous suspends (thrown during reactive updates) via the boundary spell.
 *
 * @example
 * ```typescript
 * yield* Suspense({
 *   fallback: () => div(() => [text("Loading...")]),
 *   content: function* () {
 *     const data = dataResource();  // suspend if pending
 *     yield* div(() => [text(data.message)]);
 *   },
 * });
 * ```
 */

import type { Spell, Render } from "@ydant/core";
import { div } from "@ydant/base";
import { boundary } from "./boundary";

/** Props for the Suspense component. */
export interface SuspenseProps {
  /** Component to display while loading. */
  fallback: () => Render;
  /** Content that may suspend by throwing a Promise. */
  content: () => Render;
}

/**
 * Suspense component for handling asynchronous loading states.
 *
 * Catches both synchronous suspends (thrown during initial render) and
 * asynchronous suspends (thrown during reactive updates) via the boundary spell.
 */
export function* Suspense(props: SuspenseProps): Spell<"element"> {
  const { fallback, content } = props;

  const containerSlot = yield* div(function* () {
    const retry = () => containerSlot.refresh(renderWithBoundary);

    const suspenseHandler = (error: unknown): boolean => {
      // Only handle Promises — let ErrorBoundary handle real errors
      if (!(error instanceof Promise)) return false;

      try {
        containerSlot.refresh(function* () {
          yield* boundary(suspenseHandler);
          yield* fallback();
        });
      } catch {
        // Fallback itself errored — propagate to parent
        return false;
      }
      error.then(retry, retry);
      return true;
    };

    function* renderWithBoundary() {
      yield* boundary(suspenseHandler);

      let isSuspended = false;
      let pendingPromise: Promise<unknown> | null = null;

      try {
        yield* content();
      } catch (thrown) {
        if (thrown instanceof Promise) {
          isSuspended = true;
          pendingPromise = thrown;
        } else {
          throw thrown;
        }
      }

      if (isSuspended && pendingPromise) {
        yield* fallback();
        pendingPromise.then(retry, retry);
      }
    }

    yield* renderWithBoundary();
  });

  return containerSlot;
}

/**
 * Alternative pattern using explicit loading state.
 *
 * Uses the Resource's loading property for conditional rendering.
 *
 * @example
 * ```typescript
 * import { createResource } from "@ydant/async";
 * import { show } from "@ydant/core";
 *
 * const dataResource = createResource(fetchData, { initialValue: null });
 *
 * yield* show(
 *   dataResource.loading,
 *   () => div(() => [text("Loading...")]),
 *   () => div(() => [text(dataResource()?.message ?? "")])
 * );
 * ```
 */
