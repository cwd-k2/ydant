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
 * Capability providers inject backend-specific operations (tree, decorate,
 * interact, schedule) via the same augmentation mechanism.
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
  /** The node that children are appended to. */
  parent: unknown;
  /** Registered plugins keyed by their type tags (used for dispatch). */
  plugins: Map<string, Plugin>;
  /** All registered plugins in registration order (used for lifecycle hooks). */
  allPlugins: readonly Plugin[];
  /** Processes a {@link Builder}'s instructions in a new child context. */
  processChildren(builder: Builder, options?: { parent?: unknown }): void;
  /** Creates a new child-scoped {@link RenderContext} for the given parent node. */
  createChildContext(parent: unknown): RenderContext;
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
   * Called once when the mount scope is created, before rendering begins.
   *
   * Use this to allocate resources or register event listeners that
   * live for the entire mount scope.
   */
  setup?(ctx: RenderContext): void;
  /**
   * Called when the mount scope is disposed, after rendering has stopped.
   *
   * Use this to release resources allocated in {@link setup}.
   * Teardown is called in reverse plugin registration order.
   */
  teardown?(ctx: RenderContext): void;
  /**
   * Called after context initialization but before the first iterator step.
   *
   * Use this to prepare the rendering root (e.g., clearing previous content).
   * Only called on the root context, not on child contexts.
   */
  beforeRender?(ctx: RenderContext): void;
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
  /**
   * Processes a single {@link Request} and returns a response for the generator.
   *
   * Required when `types` is non-empty. Capability-only plugins (types: [])
   * may omit this.
   */
  process?(request: Request, ctx: RenderContext): Response;
}
