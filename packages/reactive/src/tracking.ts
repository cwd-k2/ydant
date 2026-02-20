/**
 * Subscriber tracking — manages the "current subscriber" via the active ReactiveScope.
 *
 * The actual subscriber state lives in ReactiveScope (see scope.ts).
 * This module provides the same API surface but delegates to the active scope.
 *
 * Also manages dependency tracking: each subscriber remembers which signal
 * subscriber-sets it has been added to, enabling bulk cleanup on unmount.
 */

import type { Subscriber } from "./types";
import { getActiveScope, __resetForTesting__ as resetScope } from "./scope";

// Reverse index: subscriber → all Set<Subscriber> it has been added to.
// WeakMap so GC can collect subscribers that are no longer referenced.
const subscriberDeps = new WeakMap<Subscriber, Set<Set<Subscriber>>>();

/** @internal Resets tracking state. For use in tests only. */
export function __resetForTesting__(): void {
  resetScope();
}

/** Returns the subscriber currently being tracked, or `null` if none. */
export function getCurrentSubscriber(): Subscriber | null {
  return getActiveScope().current;
}

/** Runs `fn` with `subscriber` as the current tracking context, restoring the previous one afterward. */
export function runWithSubscriber<T>(subscriber: Subscriber, fn: () => T): T {
  const scope = getActiveScope();
  const prev = scope.current;
  scope.current = subscriber;
  try {
    return fn();
  } finally {
    scope.current = prev;
  }
}

/** Records that `subscriber` was added to `subscriberSet`, for later cleanup. */
export function trackDependency(subscriber: Subscriber, subscriberSet: Set<Subscriber>): void {
  let deps = subscriberDeps.get(subscriber);
  if (!deps) {
    deps = new Set();
    subscriberDeps.set(subscriber, deps);
  }
  deps.add(subscriberSet);
}

/** Removes `subscriber` from all signal subscriber-sets it was tracked in. */
export function clearDependencies(subscriber: Subscriber): void {
  const deps = subscriberDeps.get(subscriber);
  if (deps) {
    for (const set of deps) {
      set.delete(subscriber);
    }
    deps.clear();
  }
}
