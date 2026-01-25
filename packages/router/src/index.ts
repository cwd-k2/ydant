/**
 * @ydant/router
 *
 * SPA のルーティングを提供する。
 * History API を使用したクライアントサイドルーティング。
 *
 * @example
 * ```typescript
 * import { RouterView, RouterLink, useRoute, navigate } from "@ydant/router";
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

// Types
export type { RouteDefinition, RouteInfo, RouterViewProps, RouterLinkProps } from "./types";

// Navigation API
export { useRoute, navigate, goBack, goForward } from "./navigation";

// Components
export { RouterView, RouterLink } from "./components";
