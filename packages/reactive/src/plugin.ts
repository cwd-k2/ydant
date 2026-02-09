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
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createReactivePlugin()]
 * });
 * ```
 */

import type { Instruction, Feedback, Plugin, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";
import { runWithSubscriber } from "./tracking";

/** Creates the reactive plugin. Depends on the base plugin. */
export function createReactivePlugin(): Plugin {
  return {
    name: "reactive",
    types: ["reactive"],
    dependencies: ["base"],

    process(instruction: Instruction, ctx: RenderContext): Feedback {
      if (!isTagged(instruction, "reactive")) return;
      const builder = instruction.builder;

      // Create a container element for the reactive block
      const container = document.createElement("span");
      container.setAttribute("data-reactive", "");
      ctx.parent.appendChild(container);

      // Unmount callbacks accumulated during rendering
      let unmountCallbacks: Array<() => void> = [];

      // Re-render function (called on dependency change)
      const update = () => {
        // Run previous unmount callbacks
        for (const callback of unmountCallbacks) {
          callback();
        }
        unmountCallbacks = [];

        // Clear DOM and rebuild
        container.innerHTML = "";

        // Process children while tracking Signal dependencies
        runWithSubscriber(update, () => {
          ctx.processChildren(builder, { parent: container });
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
