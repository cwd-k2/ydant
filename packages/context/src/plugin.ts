/**
 * @ydant/context - Context plugin
 *
 * Processes `provide` and `inject` spell requests,
 * propagating context values through the rendering tree.
 *
 * @example
 * ```typescript
 * import { scope } from "@ydant/core";
 * import { createDOMBackend, createBasePlugin } from "@ydant/base";
 * import { createContextPlugin } from "@ydant/context";
 *
 * scope(createDOMBackend(document.getElementById("app")!), [
 *   createBasePlugin(),
 *   createContextPlugin(),
 * ]).mount(App);
 * ```
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";

/** Creates the context plugin. Depends on the base plugin. */
export function createContextPlugin(): Plugin {
  return {
    name: "context",
    types: ["context-provide", "context-inject"],
    dependencies: ["base"],

    initContext(ctx: RenderContext, parentCtx?: RenderContext) {
      // Inherit parent's context values, or start fresh
      const parentValues = parentCtx?.contextValues;
      ctx.contextValues = parentValues ? new Map(parentValues) : new Map();
    },

    process(request: Request, ctx: RenderContext): Response {
      if (isTagged(request, "context-provide")) {
        // Store the value in the context map
        ctx.contextValues.set(request.context.id, request.value);
        return;
      }
      if (isTagged(request, "context-inject")) {
        // Look up the value, falling back to defaultValue
        return ctx.contextValues.get(request.context.id) ?? request.context.defaultValue;
      }
    },
  };
}
