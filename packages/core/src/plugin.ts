/**
 * @ydant/core - Plugin system
 */

import type { Request, Response, Builder } from "./types";

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

// =============================================================================
// Plugin
// =============================================================================

/** A plugin that teaches the core runtime how to handle specific spell operations. */
export interface Plugin {
  /** Unique identifier for this plugin. */
  readonly name: string;
  /** The `type` tags this plugin handles (e.g., `["element", "text"]`). */
  readonly types: readonly string[];
  /** Names of other plugins this one depends on. Checked at mount time. */
  readonly dependencies?: readonly string[];
  /**
   * Initializes plugin-owned properties on a {@link RenderContext}.
   *
   * Called at mount time and whenever a child context is created.
   * Plugins should augment {@link RenderContext} and set their properties here.
   *
   * @param ctx - The context to initialize (core fields are already set).
   * @param parentCtx - The parent context, or `undefined` at the root.
   */
  initContext?(ctx: RenderContext, parentCtx?: RenderContext): void;
  /**
   * Propagates state from a child context back to its parent.
   *
   * Called after `processChildren` finishes iterating a child's requests.
   * Use this to merge cleanup callbacks, keyed nodes, or other accumulated state.
   *
   * @param parentCtx - The parent context.
   * @param childCtx - The child context that was just processed.
   */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /** Processes a single {@link Request} and returns a response for the generator. */
  process(request: Request, ctx: RenderContext): Response;
}
