/**
 * @ydant/core - Top-level rendering
 */

import type { Render, Response, Request } from "../types";
import type { Plugin } from "../plugin";
import { createRenderContextFactory } from "./context";
import { processIterator } from "./iterator";

// Initialize the context factory with processIterator
const createRenderContext = createRenderContextFactory(processIterator);

/** Renders a top-level {@link Render} generator into a DOM element, clearing it first. */
export function render(gen: Render, parent: HTMLElement, plugins: Map<string, Plugin>): void {
  parent.innerHTML = "";

  const ctx = createRenderContext(parent, null, plugins);

  let result = gen.next();

  while (!result.done) {
    const value = result.value;

    // Dispatch to the plugin that handles this type
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = plugins.get(type);

      if (plugin) {
        const response = plugin.process(value as Request, ctx);
        result = gen.next(response as Response);
        continue;
      }
    }

    // No plugin registered for this type — skip
    result = gen.next(undefined as Response);
  }
}

// Re-export for internal use
export { processIterator } from "./iterator";
export { createRenderContextFactory } from "./context";
export type { RenderContext } from "./types";
