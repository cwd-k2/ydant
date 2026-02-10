/**
 * Subscriber tracking — manages the "current subscriber" during effect/computed execution.
 *
 * `current` is module-level global state, properly stack-managed by `runWithSubscriber`.
 * Use `__resetForTesting__()` to isolate state between tests.
 */

import type { Subscriber } from "./types";

let current: Subscriber | null = null;

/** @internal Resets tracking state. For use in tests only. */
export function __resetForTesting__(): void {
  current = null;
}

/** Returns the subscriber currently being tracked, or `null` if none. */
export function getCurrentSubscriber(): Subscriber | null {
  return current;
}

/** Runs `fn` with `subscriber` as the current tracking context, restoring the previous one afterward. */
export function runWithSubscriber<T>(subscriber: Subscriber, fn: () => T): T {
  const prev = current;
  current = subscriber;
  try {
    return fn();
  } finally {
    current = prev;
  }
}
