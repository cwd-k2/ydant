/**
 * ReactiveScope — per-mount tracking context for subscriber isolation.
 *
 * Each mount() instance gets its own scope via the plugin's initContext().
 * Module-level operations (e.g., standalone effect()) use the default scope.
 *
 * Batch state is intentionally NOT scoped — see batch.ts for rationale.
 */

import type { Subscriber } from "./types";

/** A per-mount tracking context that holds the current subscriber. */
export interface ReactiveScope {
  current: Subscriber | null;
}

/** Creates a new ReactiveScope with no active subscriber. */
export function createReactiveScope(): ReactiveScope {
  return { current: null };
}

/** Default scope for module-level operations outside any mount(). */
const defaultScope: ReactiveScope = createReactiveScope();

/** The currently active scope. */
let activeScope: ReactiveScope = defaultScope;

/** Returns the currently active ReactiveScope. */
export function getActiveScope(): ReactiveScope {
  return activeScope;
}

/** Runs `fn` with the given scope as active, restoring the previous scope afterward. */
export function runInScope<T>(scope: ReactiveScope, fn: () => T): T {
  const prev = activeScope;
  activeScope = scope;
  try {
    return fn();
  } finally {
    activeScope = prev;
  }
}

/** @internal Resets scope state. For use in tests only. */
export function __resetForTesting__(): void {
  activeScope = defaultScope;
  defaultScope.current = null;
}
