/**
 * @ydant/router - Router plugin
 *
 * Minimal plugin that declares the router as a named plugin
 * with dependency on base. Serves as the registration point
 * and future extension hook for router-specific spell handling.
 *
 * @example
 * ```typescript
 * import { createRouterPlugin } from "@ydant/router";
 * import { mount } from "@ydant/core";
 *
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createBasePlugin(), createRouterPlugin()]
 * });
 * ```
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";

/** Creates the router plugin. Depends on the base plugin. */
export function createRouterPlugin(): Plugin {
  return {
    name: "router",
    types: [],
    dependencies: ["base"],

    process(_request: Request, _ctx: RenderContext): Response {
      return;
    },
  };
}
