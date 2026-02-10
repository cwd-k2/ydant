/**
 * Navigation API
 *
 * Route info is derived from window.location on each call (no cached state).
 * Programmatic navigation dispatches a custom DOM event for RouterView to listen on.
 */

import type { RouteInfo } from "./types";
import { parseQuery } from "./matching";
import { ROUTE_CHANGE_EVENT } from "./state";

/**
 * Get the current route information derived from window.location.
 *
 * @returns The current route info including path, query, and hash
 */
export function getRoute(): RouteInfo {
  return {
    path: window.location.pathname,
    query: parseQuery(window.location.search),
    hash: window.location.hash,
  };
}

/**
 * Navigate to a new path programmatically using the History API.
 *
 * Dispatches a `ydant:route-change` event after updating the history,
 * allowing RouterView instances to re-render.
 *
 * @param path - The destination path to navigate to
 * @param replace - When true, replaces the current history entry instead of pushing a new one
 */
export function navigate(path: string, replace = false): void {
  if (replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
}

/**
 * Navigate back one step in the browser history.
 */
export function goBack(): void {
  window.history.back();
}

/**
 * Navigate forward one step in the browser history.
 */
export function goForward(): void {
  window.history.forward();
}
