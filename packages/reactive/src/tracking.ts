/**
 * Subscriber tracking — manages the "current subscriber" via the active ReactiveScope.
 *
 * The actual subscriber state lives in ReactiveScope (see scope.ts).
 * This module provides the same API surface but delegates to the active scope.
 */

import type { Subscriber } from "./types";
import { getActiveScope, __resetForTesting__ as resetScope } from "./scope";

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
