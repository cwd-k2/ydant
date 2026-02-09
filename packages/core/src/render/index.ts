/**
 * @ydant/core - Top-level rendering
 */

import type { Render, Feedback, Instruction } from "../types";
import type { Plugin, RenderAPI } from "../plugin";
import { createRenderContext, createRenderAPIFactory } from "./context";
import { processIterator } from "./iterator";

// Lazily initialized RenderAPI factory
let createRenderAPI: ((ctx: ReturnType<typeof createRenderContext>) => RenderAPI) | null = null;

/** Renders a top-level {@link Render} generator into a DOM element, clearing it first. */
export function render(gen: Render, parent: HTMLElement, plugins: Map<string, Plugin>): void {
  parent.innerHTML = "";

  const ctx = createRenderContext(parent, null, plugins);

  // Initialize the RenderAPI factory on first call
  if (!createRenderAPI) {
    createRenderAPI = createRenderAPIFactory(processIterator);
  }

  let result = gen.next();

  while (!result.done) {
    const value = result.value;

    // Dispatch to the plugin that handles this type
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = plugins.get(type);

      if (plugin) {
        const api = createRenderAPI(ctx);
        const processResult = plugin.process(value as Instruction, api);
        result = gen.next(processResult.value as Feedback);
        continue;
      }
    }

    // No plugin registered for this type — skip
    result = gen.next(undefined as Feedback);
  }
}

// Re-export for internal use
export { processIterator } from "./iterator";
export { createRenderContext, createRenderAPIFactory } from "./context";
export type { RenderContext } from "./types";
