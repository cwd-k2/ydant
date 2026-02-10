/**
 * @ydant/base - Base plugin
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import { processElement } from "./element";
import { processAttribute, processListener, processText, processLifecycle } from "./primitives";

/**
 * Creates the base plugin that handles core DOM operations:
 * element creation, text nodes, attributes, event listeners, and lifecycle hooks.
 */
export function createBasePlugin(): Plugin {
  return {
    name: "base",
    types: ["element", "text", "attribute", "listener", "lifecycle"],

    initContext(ctx: RenderContext, parentCtx?: RenderContext) {
      if (parentCtx && ctx.parent === parentCtx.parent) {
        // processChildren path: same scope, inherit keyed nodes for reuse
        ctx.isCurrentElementReused = parentCtx.isCurrentElementReused;
        ctx.keyedNodes = parentCtx.keyedNodes;
      } else {
        // createChildContext path or root: new scope
        ctx.isCurrentElementReused = false;
        ctx.keyedNodes = new Map();
      }
      ctx.mountCallbacks = [];
      ctx.unmountCallbacks = [];
    },

    mergeChildContext(parentCtx: RenderContext, childCtx: RenderContext) {
      const parentMount = parentCtx.mountCallbacks;
      const childMount = childCtx.mountCallbacks;
      const parentUnmount = parentCtx.unmountCallbacks;
      const childUnmount = childCtx.unmountCallbacks;
      if (parentMount && childMount) {
        parentMount.push(...childMount);
      }
      if (parentUnmount && childUnmount) {
        parentUnmount.push(...childUnmount);
      }
    },

    process(request: Request, ctx: RenderContext): Response {
      if (isTagged(request, "element")) {
        return processElement(request, ctx);
      }
      if (isTagged(request, "text")) {
        processText(request, ctx);
        return;
      }
      if (isTagged(request, "attribute")) {
        processAttribute(request, ctx);
        return;
      }
      if (isTagged(request, "listener")) {
        processListener(request, ctx);
        return;
      }
      if (isTagged(request, "lifecycle")) {
        processLifecycle(request, ctx);
        return;
      }
    },
  };
}
