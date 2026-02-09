/**
 * Suspense
 *
 * Manages the loading state of asynchronous components.
 * Displays a fallback UI when a child component throws a Promise.
 *
 * @example
 * ```typescript
 * yield* Suspense({
 *   fallback: () => div(() => [text("Loading...")]),
 *   children: function* () {
 *     const data = dataResource();  // suspend if pending
 *     yield* div(() => [text(data.message)]);
 *   },
 * });
 * ```
 */

import type { ChildContent, Render } from "@ydant/core";
import { div } from "@ydant/base";

/** Props for the Suspense component. */
export interface SuspenseProps {
  /** Component to display while loading. */
  fallback: () => Render;
  /** Child content that may suspend by throwing a Promise. */
  children: () => ChildContent;
}

/**
 * Suspense component for handling asynchronous loading states.
 *
 * Note: The current implementation has limitations when combining
 * the generator-based DSL with the Promise-throw pattern.
 * As an alternative, explicit loading state management using
 * the Resource's loading/error properties is recommended.
 */
export function* Suspense(props: SuspenseProps): Render {
  const { fallback, children } = props;

  const containerSlot = yield* div(function* () {
    let isSuspended = false;
    let pendingPromise: Promise<unknown> | null = null;

    // Attempt to render children
    try {
      yield* children();
    } catch (thrown) {
      if (thrown instanceof Promise) {
        isSuspended = true;
        pendingPromise = thrown;
      } else {
        throw thrown;
      }
    }

    // Show fallback when suspended
    if (isSuspended && pendingPromise) {
      yield* fallback();

      // Re-render when the Promise resolves (on error, retry and let ErrorBoundary handle it)
      pendingPromise
        .then(() => {
          containerSlot.refresh(function* () {
            yield* children();
          });
        })
        .catch(() => {
          // Retry rendering on error as well
          // If the Resource is in an error state, children() will throw
          containerSlot.refresh(function* () {
            yield* children();
          });
        });
    }
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
