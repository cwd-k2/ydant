/**
 * @ydant/core - Top-level rendering
 */

import type { Render } from "../types";
import type { Backend, Plugin, RenderContext } from "../plugin";
import { createRenderContextFactory } from "./context";
import { processIterator } from "./iterator";

// Initialize the context factory with processIterator
const createRenderContext = createRenderContextFactory(processIterator);

/** Renders a top-level {@link Render} generator into the given root, returning the root context. */
export function render(
  gen: Render,
  backend: Backend,
  plugins: Map<string, Plugin>,
  allPlugins: readonly Plugin[],
): RenderContext {
  const ctx = createRenderContext(backend, plugins, allPlugins);

  // Let the backend prepare (e.g., clear root content)
  backend.beforeRender?.(ctx);

  processIterator(gen, ctx);
  return ctx;
}
