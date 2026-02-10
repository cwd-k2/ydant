/**
 * @ydant/context - Context plugin
 *
 * Processes `provide` and `inject` spell requests,
 * propagating context values through the rendering tree.
 *
 * @example
 * ```typescript
 * import { createContextPlugin } from "@ydant/context/plugin";
 * import { mount } from "@ydant/core";
 *
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createContextPlugin()]
 * });
 * ```
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

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
