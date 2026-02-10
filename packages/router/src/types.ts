/**
 * Type definitions for the router package
 */

import type { Component, Render } from "@ydant/core";

/** Props passed to route components, containing extracted path parameters */
export interface RouteComponentProps {
  /** Dynamic path parameters extracted from the URL (e.g. { id: "123" }) */
  params: Record<string, string>;
}

/** A single route entry that maps a URL pattern to a component */
export interface RouteDefinition {
  /** URL path pattern, supporting dynamic segments (e.g. "/users/:id") */
  path: string;
  /** Component to render when the path pattern matches the current URL */
  component: Component<RouteComponentProps>;
  /** Optional navigation guard; returning false cancels the navigation */
  guard?: () => boolean | Promise<boolean>;
}

/** Parsed information about the current route */
export interface RouteInfo {
  /** Current URL pathname */
  path: string;
  /** Parsed query string parameters */
  query: Record<string, string>;
  /** URL hash fragment */
  hash: string;
}

/** Props for the RouterView component */
export interface RouterViewProps {
  /** Array of route definitions to match against */
  routes: RouteDefinition[];
  /** Optional base path prefix for all routes */
  base?: string;
}

/** Props for the RouterLink component */
export interface RouterLinkProps {
  /** Destination path for the link */
  href: string;
  /** Child content rendered inside the link element */
  children: () => Render;
  /** CSS class name applied when the link's href matches the current route */
  activeClass?: string;
}
