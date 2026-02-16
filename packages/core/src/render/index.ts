/**
 * @ydant/core - Top-level rendering
 */

import type { Render } from "../types";
import type { ExecutionScope, RenderContext } from "../plugin";
import { createRenderContextFactory } from "./context";
import { processIterator } from "./iterator";

// Initialize the context factory with processIterator
const createRenderContext = createRenderContextFactory(processIterator);

/** Renders a top-level {@link Render} generator into the given root, returning the root context. */
export function render(gen: Render, scope: ExecutionScope): RenderContext {
  const ctx = createRenderContext(scope);

  // Let the backend prepare (e.g., clear root content)
  scope.backend.beforeRender?.(ctx);

  processIterator(gen, ctx);
  return ctx;
}
