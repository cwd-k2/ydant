/**
 * @ydant/context - Context plugin
 *
 * Processes `provide` and `inject` DSL instructions,
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

import type { Instruction, Feedback, Plugin, RenderContext } from "@ydant/core";
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

    process(instruction: Instruction, ctx: RenderContext): Feedback {
      if (isTagged(instruction, "context-provide")) {
        // Store the value in the context map
        ctx.contextValues.set(instruction.context.id, instruction.value);
        return;
      }
      if (isTagged(instruction, "context-inject")) {
        // Look up the value, falling back to defaultValue
        return ctx.contextValues.get(instruction.context.id) ?? instruction.context.defaultValue;
      }
    },
  };
}
