/**
 * @ydant/core - Child iterator processing
 */

import type { Child, Instructor, ChildNext } from "../types";
import type { RenderAPI } from "../plugin";
import type { RenderContext } from "./types";
import { createRenderAPIFactory } from "./context";

// Lazily initialized to break the circular dependency with context.ts
let createRenderAPI: ((ctx: RenderContext) => RenderAPI) | null = null;

/**
 * Walks an {@link Instructor} iterator, dispatching each yielded {@link Child}
 * to the appropriate plugin. Unrecognized types are silently skipped.
 */
export function processIterator(iter: Instructor, ctx: RenderContext): void {
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
        const processResult = plugin.process(value as Child, api);
        result = iter.next(processResult.value as ChildNext);
        continue;
      }
    }

    // No plugin registered for this type — skip
    result = iter.next();
  }
}
