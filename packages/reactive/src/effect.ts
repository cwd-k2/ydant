/**
 * Effect — a side effect that re-runs when its reactive dependencies change.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 *
 * const dispose = effect(() => {
 *   console.log(`Count is: ${count()}`);
 * });
 * // Output: "Count is: 0"
 *
 * count.set(1);
 * // Output: "Count is: 1"
 *
 * dispose();  // Unsubscribe
 * count.set(2);  // No output
 * ```
 */

import { runWithSubscriber } from "./tracking";

/**
 * Creates a reactive side effect that automatically re-runs when its dependencies change.
 *
 * The callback may return a cleanup function, which is called before each re-execution
 * and when the effect is disposed.
 *
 * @param fn - The effect function. May return a cleanup function.
 * @returns A dispose function that stops the effect and runs its cleanup.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 *
 * const dispose = effect(() => {
 *   const value = count();
 *   const timer = setTimeout(() => console.log(value), 1000);
 *   return () => clearTimeout(timer); // cleanup
 * });
 * ```
 */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;
  let isDisposed = false;

  const execute = () => {
    if (isDisposed) return;

    // Run previous cleanup
    if (cleanup) {
      try {
        cleanup();
      } catch (error) {
        console.error("[ydant] Effect cleanup threw an error:", error);
      }
      cleanup = undefined;
    }

    // Execute while tracking dependencies
    cleanup = runWithSubscriber(execute, fn);
  };

  // Initial execution
  execute();

  // Return dispose function
  return () => {
    if (!isDisposed) {
      isDisposed = true;
      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          console.error("[ydant] Effect cleanup threw an error:", error);
        }
        cleanup = undefined;
      }
    }
  };
}
