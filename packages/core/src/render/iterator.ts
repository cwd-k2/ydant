/**
 * @ydant/core - Instruction iterator processing
 */

import type { Instruction, Render, Feedback } from "../types";
import type { RenderAPI } from "../plugin";
import type { RenderContext } from "./types";
import { createRenderAPIFactory } from "./context";

// Lazily initialized to break the circular dependency with context.ts
let createRenderAPI: ((ctx: RenderContext) => RenderAPI) | null = null;

/**
 * Walks a {@link Render} generator, dispatching each yielded {@link Instruction}
 * to the appropriate plugin. Unrecognized types are silently skipped.
 */
export function processIterator(iter: Render, ctx: RenderContext): void {
  // Initialize the RenderAPI factory on first call
  if (!createRenderAPI) {
    createRenderAPI = createRenderAPIFactory(processIterator);
  }

  let result = iter.next();

  while (!result.done) {
    const value = result.value;

    // Dispatch to the plugin that handles this type
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = ctx.plugins.get(type);

      if (plugin) {
        const api = createRenderAPI(ctx);
        const processResult = plugin.process(value as Instruction, api);
        result = iter.next(processResult.value as Feedback);
        continue;
      }
    }

    // No plugin registered for this type — skip
    result = iter.next();
  }
}
