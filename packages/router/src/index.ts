/**
 * @ydant/router
 *
 * SPA のルーティングを提供する。
 * History API を使用したクライアントサイドルーティング。
 *
 * @example
 * ```typescript
 * import { RouterView, RouterLink, getRoute, navigate } from "@ydant/router";
 *
 * const App: Component = () =>
 *   div(function* () {
 *     yield* nav(() => [
 *       RouterLink({ href: "/", children: () => text("Home") }),
 *       RouterLink({ href: "/about", children: () => text("About") }),
 *     ]);
 *
 *     yield* RouterView({
 *       routes: [
 *         { path: "/", component: Home },
 *         { path: "/about", component: About },
 *         { path: "/users/:id", component: UserDetail },
 *         { path: "*", component: NotFound },
 *       ],
 *     });
 *   });
 * ```
 */

// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

// ─── Types ───
export type {
  RouteDefinition,
  RouteInfo,
  RouteComponentProps,
  RouterViewProps,
  RouterLinkProps,
} from "./types";

// ─── Runtime ───
export { getRoute, navigate, goBack, goForward } from "./navigation";
export { RouterView } from "./RouterView";
export { RouterLink } from "./RouterLink";

// ─── Plugin ───
export { createRouterPlugin } from "./plugin";
