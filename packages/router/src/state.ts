/**
 * Router state management
 *
 * NOTE: These are module-level global state variables.
 * When multiple Router instances are used simultaneously, they share the same state.
 * Use __resetForTesting__() to isolate state between tests.
 */

import type { RouteInfo } from "./types";
import { parseQuery } from "./matching";

/** Build the initial route info from the current browser URL */
function getInitialRoute(): RouteInfo {
  return {
    path: typeof window !== "undefined" ? window.location.pathname : "/",
    params: {},
    query: parseQuery(typeof window !== "undefined" ? window.location.search : ""),
    hash: typeof window !== "undefined" ? window.location.hash : "",
  };
}

/** The current route information, updated on every navigation */
export let currentRoute: RouteInfo = getInitialRoute();

/** Set of listeners invoked whenever the route changes */
export const routeListeners: Set<() => void> = new Set();

/**
 * Reset all router state to initial values.
 * @internal Intended for test isolation only.
 */
export function __resetForTesting__(): void {
  currentRoute = getInitialRoute();
  routeListeners.clear();
}

/** Update the current route by parsing the given path and notify all listeners */
export function updateRoute(path: string): void {
  const url = new URL(path, window.location.origin);
  currentRoute = {
    path: url.pathname,
    params: {},
    query: parseQuery(url.search),
    hash: url.hash,
  };

  // Notify all registered listeners
  for (const listener of routeListeners) {
    listener();
  }
}
