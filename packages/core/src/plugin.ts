/**
 * @ydant/core - Plugin system
 */

import type { Instruction, Feedback } from "./types";
import type { RenderContext } from "./render/types";

/** A plugin that teaches the core runtime how to handle specific DSL operations. */
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
   * Called after `processChildren` finishes iterating a child's instructions.
   * Use this to merge cleanup callbacks, keyed nodes, or other accumulated state.
   *
   * @param parentCtx - The parent context.
   * @param childCtx - The child context that was just processed.
   */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /** Processes a single {@link Instruction} and returns feedback for the generator. */
  process(instruction: Instruction, ctx: RenderContext): Feedback;
}
