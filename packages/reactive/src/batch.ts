/**
 * Batch updates — groups multiple Signal writes so subscribers are notified only once.
 *
 * `batchDepth` and `pendingEffects` are module-level globals.
 * Use `__resetForTesting__()` to isolate state between tests.
 *
 * @example
 * ```typescript
 * const firstName = signal("John");
 * const lastName = signal("Doe");
 *
 * effect(() => {
 *   console.log(`${firstName()} ${lastName()}`);
 * });
 * // Output: "John Doe"
 *
 * batch(() => {
 *   firstName.set("Jane");
 *   lastName.set("Smith");
 * });
 * // Output: "Jane Smith" (only once)
 * ```
 */

let batchDepth = 0;
let pendingEffects = new Set<() => void>();

/** @internal Resets batch state. For use in tests only. */
export function __resetForTesting__(): void {
  batchDepth = 0;
  pendingEffects = new Set();
}

/**
 * Executes a function in a batch context.
 *
 * Signal updates inside the batch are collected; their effects run once
 * when the outermost batch completes. Batches can be nested.
 */
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const effects = pendingEffects;
      pendingEffects = new Set();
      for (const effect of effects) {
        effect();
      }
    }
  }
}

/**
 * @internal Queues an effect for deferred execution if a batch is active.
 * @returns `true` if the effect was queued (inside a batch), `false` otherwise.
 */
export function scheduleEffect(effect: () => void): boolean {
  if (batchDepth > 0) {
    pendingEffects.add(effect);
    return true;
  }
  return false;
}
