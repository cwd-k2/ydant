/**
 * @ydant/core - Top-level rendering
 */

import type { Render } from "../types";
import type { Plugin } from "../plugin";
import { createRenderContextFactory } from "./context";
import { processIterator } from "./iterator";

// Initialize the context factory with processIterator
const createRenderContext = createRenderContextFactory(processIterator);

/** Renders a top-level {@link Render} generator into a DOM element, clearing it first. */
export function render(gen: Render, parent: HTMLElement, plugins: Map<string, Plugin>): void {
  parent.innerHTML = "";
  const ctx = createRenderContext(parent, null, plugins);
  processIterator(gen, ctx);
}

export type { RenderContext } from "./types";
