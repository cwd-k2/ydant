/**
 * @ydant/router
 *
 * SPA ルーティング
 */

export {
  // Primary exports
  RouterView,
  RouterLink,
  useRoute,
  navigate,
  goBack,
  goForward,
  // Legacy aliases (deprecated)
  Router,
  Link,
} from "./router";

export type {
  RouteDefinition,
  RouteInfo,
  RouterViewProps,
  RouterLinkProps,
  // Legacy aliases (deprecated)
  RouterProps,
  LinkProps,
} from "./router";
