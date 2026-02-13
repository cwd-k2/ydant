/**
 * @ydant/core - Top-level rendering
 */

import type { Render } from "../types";
import type { Plugin, RenderContext } from "../plugin";
import { createRenderContextFactory } from "./context";
import { processIterator } from "./iterator";

// Initialize the context factory with processIterator
const createRenderContext = createRenderContextFactory(processIterator);

/**
 * Iterates over registered plugins, calling each one exactly once.
 */
function forEachUniquePlugin(plugins: readonly Plugin[], callback: (plugin: Plugin) => void): void {
  const visited = new Set<string>();
  for (const plugin of plugins) {
    if (visited.has(plugin.name)) continue;
    visited.add(plugin.name);
    callback(plugin);
  }
}

/** Renders a top-level {@link Render} generator into the given root, returning the root context. */
export function render(
  gen: Render,
  root: unknown,
  plugins: Map<string, Plugin>,
  allPlugins: readonly Plugin[],
): RenderContext {
  const ctx = createRenderContext(root, plugins, allPlugins);

  // Let capability providers prepare (replaces target.prepare())
  forEachUniquePlugin(allPlugins, (plugin) => {
    plugin.beforeRender?.(ctx);
  });

  processIterator(gen, ctx);
  return ctx;
}
