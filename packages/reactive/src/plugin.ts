/// <reference path="./global.d.ts" />
/**
 * @ydant/reactive - Reactive plugin
 *
 * Tracks Signal dependencies during rendering and automatically re-renders
 * reactive blocks when their dependencies change.
 *
 * @example
 * ```typescript
 * import { createReactivePlugin } from "@ydant/reactive/plugin";
 * import { mount } from "@ydant/core";
 *
 * mount(App, {
 *   root: document.getElementById("app")!,
 *   plugins: [createDOMCapabilities(), createBasePlugin(), createReactivePlugin()]
 * });
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

      // Re-render function (called on dependency change)
      const update = () => {
        // Run previous unmount callbacks
        for (const callback of unmountCallbacks) {
          callback();
        }
        unmountCallbacks = [];

        // Clear container and rebuild
        ctx.tree.clearChildren(container);

        // Process children while tracking Signal dependencies, within the mount's scope
        runInScope(scope, () => {
          runWithSubscriber(update, () => {
            ctx.processChildren(builder, { parent: container });
          });
        });
      };

      // Initial render
      update();

      // Cleanup on unmount
      ctx.unmountCallbacks.push(() => {
        for (const callback of unmountCallbacks) {
          callback();
        }
      });
    },
  };
}
