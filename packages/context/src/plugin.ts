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

import type { Instruction, Plugin, RenderAPI, ProcessResult, RenderContext } from "@ydant/core";
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

    extendAPI(api: Partial<RenderAPI>, ctx: RenderContext) {
      const contextValues = ctx.contextValues;
      api.getContext = <T>(id: symbol): T | undefined => {
        return contextValues.get(id) as T | undefined;
      };
      api.setContext = <T>(id: symbol, value: T): void => {
        contextValues.set(id, value);
      };
    },

    process(instruction: Instruction, api: RenderAPI): ProcessResult {
      if (isTagged(instruction, "context-provide")) {
        // Store the value in the context map
        api.setContext(instruction.context.id, instruction.value);
        return {};
      }
      if (isTagged(instruction, "context-inject")) {
        // Look up the value, falling back to defaultValue
        const value = api.getContext(instruction.context.id) ?? instruction.context.defaultValue;
        return { value };
      }

      return {};
    },
  };
}
