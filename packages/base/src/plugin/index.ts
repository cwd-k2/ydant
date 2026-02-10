/**
 * @ydant/base - Base plugin
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import { processElement } from "./element";
import { processAttribute, processListener, processText, processLifecycle } from "./primitives";

/**
 * Executes pending mount callbacks on the next animation frame.
 * If a mount callback returns a cleanup function, it is added to unmountCallbacks.
 */
export function executeMount(ctx: RenderContext): void {
  const mountCallbacks = ctx.mountCallbacks;
  const unmountCallbacks = ctx.unmountCallbacks;

  requestAnimationFrame(() => {
    for (const callback of mountCallbacks) {
      const cleanup = callback();
      if (typeof cleanup === "function") {
        unmountCallbacks.push(cleanup);
      }
    }
    ctx.mountCallbacks = [];
  });
}

/**
 * Creates the base plugin that handles core DOM operations:
 * element creation, text nodes, attributes, event listeners, and lifecycle hooks.
 */
export function createBasePlugin(): Plugin {
  return {
    name: "base",
    types: ["element", "text", "attribute", "listener", "lifecycle"],

    initContext(ctx: RenderContext) {
      ctx.isCurrentElementReused = false;
      ctx.keyedNodes = new Map();
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
