/**
 * Lazy
 *
 * Defers subtree evaluation until a trigger condition is met.
 * Supports viewport visibility (IntersectionObserver) and browser idle
 * (requestIdleCallback) triggers. Renders an optional fallback while waiting.
 *
 * @example
 * ```typescript
 * yield* Lazy({
 *   content: function* () { yield* HeavyComponent(); },
 *   fallback: function* () { yield* text("Loading..."); },
 *   trigger: "visible",
 *   rootMargin: "200px",
 * });
 * ```
 */

import type { Spell, Render } from "@ydant/core";
import { div } from "@ydant/base";
import { onMount, onUnmount } from "@ydant/base";

/** Props for the Lazy component. */
export interface LazyProps {
  /** Content to render when the trigger fires. */
  content: () => Render;
  /** Optional fallback to display while waiting. */
  fallback?: () => Render;
  /**
   * When to trigger rendering.
   * - `"visible"` — when the container enters the viewport (IntersectionObserver)
   * - `"idle"` — when the browser is idle (requestIdleCallback)
   *
   * @default "visible"
   */
  trigger?: "visible" | "idle";
  /** IntersectionObserver rootMargin option. Only used with `trigger: "visible"`. */
  rootMargin?: string;
  /** IntersectionObserver threshold option. Only used with `trigger: "visible"`. */
  threshold?: number | number[];
}

/**
 * Lazy component for deferred subtree evaluation.
 *
 * Wraps content in a container element. The content is not evaluated
 * until the trigger condition is met (viewport visibility or browser idle).
 */
export function* Lazy(props: LazyProps): Spell<"element"> {
  const { content, fallback, trigger = "visible", rootMargin, threshold } = props;

  // Cleanup set by onMount, called by onUnmount.
  // onUnmount is registered synchronously and propagated to parent correctly,
  // while onMount cleanup (return value) is only pushed after rAF.
  let cleanup: (() => void) | undefined;

  const containerSlot = yield* div(function* () {
    // Render fallback if provided
    if (fallback) {
      yield* fallback();
    }

    yield* onMount(() => {
      const node = containerSlot.node as globalThis.Element;

      const activate = () => {
        containerSlot.refresh(content);
      };

      if (trigger === "visible") {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              observer.disconnect();
              activate();
            }
          },
          { rootMargin, threshold },
        );
        observer.observe(node);
        cleanup = () => observer.disconnect();
        return;
      }

      // trigger === "idle"
      if (typeof requestIdleCallback !== "undefined") {
        const id = requestIdleCallback(() => activate());
        cleanup = () => cancelIdleCallback(id);
        return;
      }
      // Fallback for environments without requestIdleCallback
      const id = setTimeout(() => activate(), 0);
      cleanup = () => clearTimeout(id);
    });

    yield* onUnmount(() => cleanup?.());
  });

  return containerSlot;
}
