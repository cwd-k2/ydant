/**
 * @ydant/core - Spell request iterator processing
 */

import type { Request, Render, Response } from "../types";
import type { RenderContext } from "../plugin";

/**
 * Walks a {@link Render} generator, dispatching each yielded {@link Request}
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
        const response = plugin.process(value as Request, ctx);
        result = iter.next(response as Response);
        continue;
      }
    }

    // No plugin registered for this type — skip
    result = iter.next();
  }
}
