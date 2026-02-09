/**
 * RouterView component
 *
 * Renders the component that matches the current URL path.
 * Compares route definitions against the current URL and renders the first match.
 *
 * @example
 * ```typescript
 * yield* RouterView({
 *   routes: [
 *     { path: "/", component: Home },
 *     { path: "/about", component: About },
 *     { path: "/users/:id", component: UserDetail },
 *     { path: "*", component: NotFound },
 *   ],
 *   base: "/app",  // optional: base path prefix
 * });
 * ```
 */

import type { Render } from "@ydant/core";
import { div, onMount } from "@ydant/base";
import type { RouteDefinition, RouterViewProps } from "./types";
import { currentRoute, routeListeners, updateRoute } from "./state";
import { matchPath } from "./matching";

/**
 * Find the first route definition that matches the current path, returning the route and extracted params.
 */
function findMatchedRoute(
  routes: RouteDefinition[],
  base: string,
): { route: RouteDefinition; params: Record<string, string> } | null {
  const path = currentRoute.path.startsWith(base)
    ? currentRoute.path.slice(base.length) || "/"
    : currentRoute.path;

  for (const route of routes) {
    const { match, params } = matchPath(path, route.path);
    if (match) {
      return { route, params };
    }
  }

  return null;
}

/**
 * Synchronously render the matched route's component (only when the guard is synchronous).
 */
function renderMatchedRouteSync(routes: RouteDefinition[], base: string): Render[] {
  const matched = findMatchedRoute(routes, base);
  if (!matched) return [];

  const { route, params } = matched;
  currentRoute.params = params;

  // If there is no guard, render the component directly
  if (!route.guard) {
    return [route.component()];
  }

  const allowed = route.guard();
  if (allowed instanceof Promise) {
    // For async guards, return empty; a refresh will be triggered later
    return [];
  }

  return allowed ? [route.component()] : [];
}

/**
 * Handle async route guards and call refresh when the guard resolves to true.
 */
async function handleAsyncGuard(
  routes: RouteDefinition[],
  base: string,
  refresh: (builder: () => Render[]) => void,
): Promise<void> {
  const matched = findMatchedRoute(routes, base);
  if (!matched) return;

  const { route, params } = matched;

  if (route.guard) {
    const allowed = route.guard();
    if (allowed instanceof Promise) {
      const result = await allowed;
      if (result) {
        currentRoute.params = params;
        refresh(() => [route.component()]);
      }
      // If the guard returned false, do not refresh (stays empty)
    }
  }
}

/**
 * RouterView component
 *
 * Displays the component matching the current URL path.
 * Listens for History API popstate events to re-render on URL changes.
 *
 * @param props - RouterView properties
 * @param props.routes - Array of route definitions to match against
 * @param props.base - Base path prefix (optional, defaults to "")
 * @returns A Render for the container element
 */
export function RouterView(props: RouterViewProps): Render {
  const { routes, base = "" } = props;

  return div(function* () {
    // Create an inner container slot for the matched route's content
    const innerSlot = yield* div(() => renderMatchedRouteSync(routes, base));

    // Handle initial async guard evaluation
    handleAsyncGuard(routes, base, (builder) => innerSlot.refresh(builder));

    // Register a popstate event listener for browser navigation
    yield* onMount(() => {
      const handlePopState = () => {
        updateRoute(window.location.pathname);
        innerSlot.refresh(() => renderMatchedRouteSync(routes, base));
        handleAsyncGuard(routes, base, (builder) => innerSlot.refresh(builder));
      };

      window.addEventListener("popstate", handlePopState);

      // Register a route change listener for programmatic navigation
      const routeChangeListener = () => {
        innerSlot.refresh(() => renderMatchedRouteSync(routes, base));
        handleAsyncGuard(routes, base, (builder) => innerSlot.refresh(builder));
      };
      routeListeners.add(routeChangeListener);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        routeListeners.delete(routeChangeListener);
      };
    });
  });
}
