/**
 * RouterLink component
 *
 * Renders an `<a>` element that performs SPA navigation via navigate() on click.
 * Prevents the browser's default link behavior to enable client-side routing.
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
import { a, on, attr } from "@ydant/base";
import type { RouterLinkProps } from "./types";
import { navigate } from "./navigation";

/**
 * RouterLink component
 *
 * Renders an anchor element that intercepts click events and uses
 * the History API for SPA navigation instead of full page reloads.
 *
 * @param props - RouterLink properties
 * @param props.href - Destination path for the link
 * @param props.children - Child content to render inside the link
 * @param props.activeClass - CSS class name applied when href matches the current route (optional)
 * @returns A Render for the anchor element
 */
export function RouterLink(props: RouterLinkProps): Render {
  const { href, children, activeClass } = props;

  return a(function* () {
    yield* attr("href", href);

    // Apply the active class when the current route matches this link's href
    if (activeClass && window.location.pathname === href) {
      yield* attr("class", activeClass);
    }

    yield* on("click", (e: Event) => {
      e.preventDefault();
      navigate(href);
    });

    yield* children();
  });
}
