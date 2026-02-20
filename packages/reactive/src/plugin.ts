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
import { runWithSubscriber, clearDependencies } from "./tracking";
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

      // Create marker boundaries (replaces <span data-reactive="">)
      const startMarker = ctx.tree.createMarker();
      const endMarker = ctx.tree.createMarker();
      if (ctx.insertionRef !== undefined) {
        ctx.tree.insertBefore(ctx.parent, startMarker, ctx.insertionRef);
        ctx.tree.insertBefore(ctx.parent, endMarker, ctx.insertionRef);
      } else {
        ctx.tree.appendChild(ctx.parent, startMarker);
        ctx.tree.appendChild(ctx.parent, endMarker);
      }

      // Active flag — set to false on unmount to prevent stale subscriptions
      let active = true;
      // Unmount callbacks accumulated during rendering
      let unmountCallbacks: Array<() => void> = [];
      // Keyed nodes preserved across rerenders for DOM node reuse
      let savedKeyedNodes: RenderContext["keyedNodes"] | undefined;

      // Remove all nodes between start and end markers
      const clearBetweenMarkers = () => {
        let current = ctx.tree.nextSibling(ctx.parent, startMarker);
        while (current && current !== endMarker) {
          const next = ctx.tree.nextSibling(ctx.parent, current);
          ctx.tree.removeChild(ctx.parent, current);
          current = next;
        }
      };

      // Actual re-render logic
      const rerender = () => {
        if (!active) return;

        // Clear previous signal subscriptions before re-tracking
        clearDependencies(subscriber);

        // Run previous unmount callbacks
        for (const callback of unmountCallbacks) {
          callback();
        }
        unmountCallbacks = [];

        // Clear content between markers and rebuild
        clearBetweenMarkers();

        // Record the current length so we can splice off child-added callbacks
        const beforeLength = ctx.unmountCallbacks.length;

        // Process children while tracking Signal dependencies, within the mount's scope
        // subscriber is the tracking callback — it enqueues rerender on signal change
        try {
          runInScope(scope, () => {
            runWithSubscriber(subscriber, () => {
              ctx.processChildren(builder, {
                parent: ctx.parent,
                contextInit: (childCtx) => {
                  // Insert new nodes before end marker
                  childCtx.insertionRef = endMarker;
                  // Restore keyed nodes from previous render for DOM node reuse
                  childCtx.keyedNodes = savedKeyedNodes ?? childCtx.keyedNodes;
                  savedKeyedNodes = childCtx.keyedNodes;
                },
              });
            });
          });
        } catch (error) {
          // Delegate to error boundary if available
          try {
            if (ctx.handleRenderError?.(error)) return;
          } catch {
            // Handler itself threw — fall through to re-throw original error
          }
          throw error;
        }

        // Capture child unmount callbacks for cleanup on next rerender
        unmountCallbacks = ctx.unmountCallbacks.splice(beforeLength);
      };

      // Subscriber: called when a tracked signal changes → enqueue rerender
      const subscriber = () => ctx.engine.enqueue(rerender);

      // Initial render (synchronous — does not go through engine queue)
      rerender();

      // Cleanup on unmount (idempotent — may be called more than once via Slot refresh)
      ctx.unmountCallbacks.push(() => {
        if (!active) return;
        active = false;
        clearDependencies(subscriber);
        clearBetweenMarkers();
        ctx.tree.removeChild(ctx.parent, startMarker);
        ctx.tree.removeChild(ctx.parent, endMarker);
        for (const callback of unmountCallbacks) {
          callback();
        }
      });
    },
  };
}
