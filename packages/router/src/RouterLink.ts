/**
 * RouterLink component
 *
 * Renders an `<a>` element that performs SPA navigation via navigate() on click.
 * Prevents the browser's default link behavior to enable client-side routing.
 * When `activeClass` is specified, it reacts to navigation events (popstate and
 * programmatic) to dynamically add/remove the class.
 *
 * @example
 * ```typescript
 * yield* RouterLink({
 *   href: "/about",
 *   activeClass: "active",
 *   children: () => text("About"),
 * });
 * ```
 */

import type { Render } from "@ydant/core";
import { a, on, attr, onMount } from "@ydant/base";
import type { RouterLinkProps } from "./types";
import { navigate } from "./navigation";
import { ROUTE_CHANGE_EVENT } from "./state";

/**
 * RouterLink component
 *
 * Renders an anchor element that intercepts click events and uses
 * the History API for SPA navigation instead of full page reloads.
 * Listens for route change events to reactively update the active class.
 *
 * @param props - RouterLink properties
 * @param props.href - Destination path for the link
 * @param props.children - Child content to render inside the link
 * @param props.activeClass - CSS class name applied when href matches the current route (optional)
 * @returns A Render for the anchor element
 */
export function RouterLink(props: RouterLinkProps): Render {
  const { href, children, activeClass } = props;

  return (function* () {
    const slot = yield* a(function* () {
      yield* attr("href", href);

      // Apply the active class on initial render if matching
      if (activeClass && window.location.pathname === href) {
        yield* attr("class", activeClass);
      }

      yield* on("click", (e: Event) => {
        e.preventDefault();
        navigate(href);
      });

      yield* children();
    });

    // Listen for route changes to reactively update the active class
    if (activeClass) {
      const node = slot.node as HTMLElement;

      yield* onMount(() => {
        const update = () => {
          if (window.location.pathname === href) {
            node.setAttribute("class", activeClass);
          } else {
            node.removeAttribute("class");
          }
        };

        window.addEventListener("popstate", update);
        window.addEventListener(ROUTE_CHANGE_EVENT, update);

        return () => {
          window.removeEventListener("popstate", update);
          window.removeEventListener(ROUTE_CHANGE_EVENT, update);
        };
      });
    }
  })();
}
