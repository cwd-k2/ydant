/**
 * RouterView component
 *
 * Renders the component that matches the current URL path.
 * Compares route definitions against the current URL and renders the first match.
 * Listens for `popstate` and `ydant:route-change` DOM events for re-rendering.
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
import { div, onMount, refresh } from "@ydant/base";
import type { RouteDefinition, RouterViewProps } from "./types";
import { ROUTE_CHANGE_EVENT } from "./state";
import { matchPath } from "./matching";

/**
 * Find the first route definition that matches the given path, returning the route and extracted params.
 */
function findMatchedRoute(
  routes: RouteDefinition[],
  base: string,
  path: string,
): { route: RouteDefinition; params: Record<string, string> } | null {
  const relativePath = path.startsWith(base) ? path.slice(base.length) || "/" : path;

  for (const route of routes) {
    const { match, params } = matchPath(relativePath, route.path);
    if (match) {
      return { route, params };
    }
  }

  return null;
}

/**
 * Build the content for a matched route, passing params as props to the component.
 */
function renderMatchedRouteContent(
  matched: { route: RouteDefinition; params: Record<string, string> } | null,
): Render[] {
  if (!matched) return [];

  const { route, params } = matched;

  // If there is no guard, render the component directly with params
  if (!route.guard) {
    return [route.component({ params })];
  }

  const allowed = route.guard();
  if (allowed instanceof Promise) {
    // For async guards, return empty; a refresh will be triggered later
    return [];
  }

  return allowed ? [route.component({ params })] : [];
}

/**
 * Handle async route guards and call refresh when the guard resolves to true.
 */
async function handleAsyncGuard(
  matched: { route: RouteDefinition; params: Record<string, string> } | null,
  refresh: (builder: () => Render[]) => void,
): Promise<void> {
  if (!matched) return;

  const { route, params } = matched;

  if (route.guard) {
    const allowed = route.guard();
    if (allowed instanceof Promise) {
      const result = await allowed;
      if (result) {
        refresh(() => [route.component({ params })]);
      }
    }
  }
}

/**
 * RouterView component
 *
 * Displays the component matching the current URL path.
 * Listens for `popstate` (browser back/forward) and `ydant:route-change`
 * (programmatic navigation) events to re-render on URL changes.
 *
 * @param props - RouterView properties
 * @param props.routes - Array of route definitions to match against
 * @param props.base - Base path prefix (optional, defaults to "")
 * @returns A Render for the container element
 */
export function RouterView(props: RouterViewProps): Render {
  const { routes, base = "" } = props;

  return div(function* () {
    const matched = findMatchedRoute(routes, base, window.location.pathname);

    // Create an inner container slot for the matched route's content
    const innerSlot = yield* div(() => renderMatchedRouteContent(matched));

    // Handle initial async guard evaluation
    handleAsyncGuard(matched, (builder) => refresh(innerSlot, builder));

    // Listen for route change events
    yield* onMount(() => {
      const handleRouteChange = () => {
        const newMatched = findMatchedRoute(routes, base, window.location.pathname);
        refresh(innerSlot, () => renderMatchedRouteContent(newMatched));
        handleAsyncGuard(newMatched, (builder) => refresh(innerSlot, builder));
      };

      window.addEventListener("popstate", handleRouteChange);
      window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);

      return () => {
        window.removeEventListener("popstate", handleRouteChange);
        window.removeEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
      };
    });
  });
}
