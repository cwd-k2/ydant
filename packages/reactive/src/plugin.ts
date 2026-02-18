/// <reference path="./global.d.ts" />
/**
 * @ydant/reactive - Reactive plugin
 *
 * Tracks Signal dependencies during rendering and automatically re-renders
 * reactive blocks when their dependencies change.
 *
 * Updates are batched through the Engine's task queue. When a Signal changes,
 * the rerender is enqueued (not executed immediately). The Engine's Scheduler
 * decides when to flush, and Set dedup ensures each reactive block rerenders
 * at most once per flush cycle even if multiple dependencies change.
 *
 * @example
 * ```typescript
 * import { scope } from "@ydant/core";
 * import { createDOMBackend, createBasePlugin } from "@ydant/base";
 * import { createReactivePlugin } from "@ydant/reactive";
 *
 * scope(createDOMBackend(document.getElementById("app")!), [
 *   createBasePlugin(),
 *   createReactivePlugin(),
 * ]).mount(App);
 * ```
 */

import type { Request, Response, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";
import { runWithSubscriber } from "./tracking";
import { createReactiveScope, runInScope } from "./scope";

/** Creates the reactive plugin. Depends on the base plugin. */
export function createReactivePlugin(): Plugin {
  return {
    name: "reactive",
    types: ["reactive"],
    dependencies: ["base"],

    initContext(ctx: RenderContext, parentCtx?: RenderContext) {
      ctx.reactiveScope = parentCtx?.reactiveScope ?? createReactiveScope();
    },

    process(request: Request, ctx: RenderContext): Response {
      if (!isTagged(request, "reactive")) return;
      const builder = request.builder;
      const scope = ctx.reactiveScope;

      // Create a container element for the reactive block
      const container = ctx.tree.createElement("span");
      ctx.decorate.setAttribute(container, "data-reactive", "");
      ctx.tree.appendChild(ctx.parent, container);

      // Unmount callbacks accumulated during rendering
      let unmountCallbacks: Array<() => void> = [];

      // Actual re-render logic
      const rerender = () => {
        // Run previous unmount callbacks
        for (const callback of unmountCallbacks) {
          callback();
        }
        unmountCallbacks = [];

        // Clear container and rebuild
        ctx.tree.clearChildren(container);

        // Process children while tracking Signal dependencies, within the mount's scope
        // subscriber is the tracking callback — it enqueues rerender on signal change
        try {
          runInScope(scope, () => {
            runWithSubscriber(subscriber, () => {
              ctx.processChildren(builder, { parent: container });
            });
          });
        } catch (error) {
          // Delegate to error boundary if available
          if (ctx.handleRenderError?.(error)) return;
          throw error;
        }
      };

      // Subscriber: called when a tracked signal changes → enqueue rerender
      const subscriber = () => ctx.engine.enqueue(rerender);

      // Initial render (synchronous — does not go through engine queue)
      rerender();

      // Cleanup on unmount
      ctx.unmountCallbacks.push(() => {
        for (const callback of unmountCallbacks) {
          callback();
        }
      });
    },
  };
}
