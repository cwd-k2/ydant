/**
 * @ydant/core - Internal rendering types
 */

import type { Builder } from "../types";
import type { Plugin } from "../plugin";

// =============================================================================
// RenderContext
// =============================================================================

/**
 * Per-scope state carried through the rendering tree.
 *
 * Core fields are defined here; plugins add their own properties
 * via module augmentation (e.g., `@ydant/base` adds `keyedNodes`,
 * `@ydant/context` adds `contextValues`).
 *
 * @example
 * ```typescript
 * declare module "@ydant/core" {
 *   interface RenderContext {
 *     keyedNodes: Map<string | number, unknown>;
 *   }
 * }
 * ```
 */
export interface RenderContext {
  /** The DOM node that children are appended to. */
  parent: Node;
  /** The element currently being decorated, or `null` between elements. */
  currentElement: globalThis.Element | null;
  /** Registered plugins keyed by their type tags. */
  plugins: Map<string, Plugin>;
  /** Processes a {@link Builder}'s instructions in a new child context. */
  processChildren(builder: Builder, options?: { parent?: Node }): void;
  /** Creates a new child-scoped {@link RenderContext} for the given parent node. */
  createChildContext(parent: Node): RenderContext;
}
