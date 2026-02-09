/**
 * @ydant/core - Instruction iterator processing
 */

import type { Instruction, Render, Feedback } from "../types";
import type { RenderContext } from "./types";

/**
 * Walks a {@link Render} generator, dispatching each yielded {@link Instruction}
 * to the appropriate plugin. Unrecognized types are silently skipped.
 */
export function processIterator(iter: Render, ctx: RenderContext): void {
  let result = iter.next();

  while (!result.done) {
    const value = result.value;

    // Dispatch to the plugin that handles this type
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = ctx.plugins.get(type);

      if (plugin) {
        const feedback = plugin.process(value as Instruction, ctx);
        result = iter.next(feedback as Feedback);
        continue;
      }
    }

    // No plugin registered for this type — skip
    result = iter.next();
  }
}
