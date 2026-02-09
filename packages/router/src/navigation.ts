/**
 * Navigation API
 */

import type { RouteInfo } from "./types";
import { currentRoute, updateRoute } from "./state";

/**
 * Get the current route information.
 *
 * @returns The current route info including path, params, and query
 */
export function getRoute(): RouteInfo {
  return currentRoute;
}

/**
 * Navigate to a new path programmatically using the History API.
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
  updateRoute(path);
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
