/// <reference path="./global.d.ts" />
/**
 * @ydant/async - Async plugin
 *
 * Processes `boundary` spell requests and manages the handleRenderError
 * chain on RenderContext. This enables ErrorBoundary and Suspense to
 * catch errors from async render updates (e.g., reactive re-renders).
 *
 * @example
 * ```typescript
 * import { scope } from "@ydant/core";
 * import { createDOMBackend, createBasePlugin } from "@ydant/base";
 * import { createAsyncPlugin } from "@ydant/async";
 *
 * scope(createDOMBackend(document.getElementById("app")!), [
 *   createBasePlugin(),
 *   createAsyncPlugin(),
 * ]).mount(App);
 * ```
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";

/** Creates the async plugin. Depends on the base plugin. */
export function createAsyncPlugin(): Plugin {
  return {
    name: "async",
    types: ["boundary"],
    dependencies: ["base"],

    initContext(ctx: RenderContext, parentCtx?: RenderContext) {
      // Inherit parent's error handler — enables nested boundaries
      ctx.handleRenderError = parentCtx?.handleRenderError;
    },

    process(request: Request, ctx: RenderContext): Response {
      if (!isTagged(request, "boundary")) return;

      const parentHandler = ctx.handleRenderError;
      // Chain: inner handler runs first, falls back to parent if not handled
      ctx.handleRenderError = (error: unknown): boolean => {
        try {
          if (request.handler(error)) return true;
        } catch {
          // Inner handler threw — fall through to parent
        }
        return parentHandler?.(error) ?? false;
      };
    },
  };
}
