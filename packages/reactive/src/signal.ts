/**
 * Signal — a reactive container holding a single value.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * console.log(count());  // 0
 * count.set(1);
 * console.log(count());  // 1
 * count.update(n => n + 1);
 * console.log(count());  // 2
 * ```
 */

import type { Subscriber, Readable } from "./types";
import { getCurrentSubscriber } from "./tracking";
import { scheduleEffect } from "./batch";

/** A read-write reactive value. Extends {@link Readable} with `set` and `update`. */
export interface Signal<T> extends Readable<T> {
  /** Replaces the current value. Notifies subscribers if the value changed. */
  set(value: T): void;
  /** Updates the value by applying a function to the previous value. */
  update(fn: (prev: T) => T): void;
}

/**
 * Creates a {@link Signal} with the given initial value.
 *
 * @example
 * ```typescript
 * const count = signal(0);
 *
 * // Read (with dependency tracking)
 * console.log(count());  // 0
 *
 * // Write
 * count.set(5);
 * count.update(n => n * 2);  // 10
 *
 * // Read without tracking
 * console.log(count.peek());  // 10
 * ```
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Subscriber>();

  const read = (() => {
    // Register the current subscriber (if any) as a dependency
    const subscriber = getCurrentSubscriber();
    if (subscriber) {
      subscribers.add(subscriber);
    }
    return value;
  }) as Signal<T>;

  read.set = (newValue: T) => {
    if (!Object.is(value, newValue)) {
      value = newValue;
      // Notify all subscribers (deferred during batch)
      for (const sub of subscribers) {
        // Queue for deferred execution if inside a batch
        const scheduled = scheduleEffect(sub);
        if (!scheduled) {
          // Outside batch — execute immediately
          sub();
        }
      }
    }
  };

  read.update = (fn: (prev: T) => T) => {
    read.set(fn(value));
  };

  read.peek = () => value;

  return read;
}
