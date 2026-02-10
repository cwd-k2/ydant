/**
 * Computed — a read-only derived value that recomputes when its dependencies change.
 *
 * @example
 * ```typescript
 * const count = signal(5);
 * const doubled = computed(() => count() * 2);
 * console.log(doubled());  // 10
 * count.set(10);
 * console.log(doubled());  // 20
 * ```
 */

import type { Subscriber, Readable } from "./types";
import { getCurrentSubscriber, runWithSubscriber } from "./tracking";

/** A read-only reactive derived value. See {@link computed}. */
export interface Computed<T> extends Readable<T> {}

/**
 * Creates a {@link Computed} value derived from other reactive sources.
 *
 * The computation is lazy — it only re-evaluates when read after a dependency change.
 *
 * @param fn - A function that computes the derived value by reading reactive sources.
 *
 * @example
 * ```typescript
 * const firstName = signal("John");
 * const lastName = signal("Doe");
 * const fullName = computed(() => `${firstName()} ${lastName()}`);
 *
 * console.log(fullName());  // "John Doe"
 * firstName.set("Jane");
 * console.log(fullName());  // "Jane Doe"
 * ```
 */
export function computed<T>(fn: () => T): Computed<T> {
  let cachedValue: T;
  let isDirty = true;
  const subscribers = new Set<Subscriber>();

  // This computed subscribes to its dependencies as a subscriber
  const recompute = () => {
    isDirty = true;
    // Notify downstream subscribers
    for (const sub of subscribers) {
      sub();
    }
  };

  const read = (() => {
    // Register the current subscriber (if any) as a dependency
    const currentSub = getCurrentSubscriber();
    if (currentSub) {
      subscribers.add(currentSub);
    }

    if (isDirty) {
      // Recompute while tracking dependencies
      cachedValue = runWithSubscriber(recompute, fn);
      isDirty = false;
    }

    return cachedValue;
  }) as Computed<T>;

  read.peek = () => {
    if (isDirty) {
      cachedValue = fn();
      isDirty = false;
    }
    return cachedValue;
  };

  return read;
}
