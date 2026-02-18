/**
 * @ydant/core - Embed spell and plugin
 *
 * Allows switching execution scopes within a render tree.
 * This is the mechanism for embedding one rendering environment
 * inside another (e.g., Canvas inside DOM).
 *
 * Embed always executes synchronously — it is a structural rendering
 * operation, not an update. For cross-scope embeds, the plugin ensures
 * an Engine exists for the target scope so that future reactive updates
 * within the embedded scope can use it.
 */

import type { Tagged, Spell, Builder } from "./types";
import type { Engine, ExecutionScope, Plugin, RenderContext, Scheduler } from "./plugin";

// =============================================================================
// Types
// =============================================================================

/** An embed request — renders children under a different {@link ExecutionScope}. */
export type Embed = Tagged<
  "embed",
  { scope: ExecutionScope; content: Builder; scheduler?: Scheduler }
>;

// =============================================================================
// Spell
// =============================================================================

/** Renders children under a different execution scope. Use with `yield*`. Returns the {@link Engine} for the target scope. */
export function* embed(
  scope: ExecutionScope,
  content: Builder,
  options?: { scheduler?: Scheduler },
): Spell<"embed"> {
  return (yield {
    type: "embed",
    scope,
    content,
    scheduler: options?.scheduler,
  } as Embed) as Engine;
}

// =============================================================================
// Plugin
// =============================================================================

/** Creates the embed plugin that handles scope-switching requests. */
export function createEmbedPlugin(): Plugin {
  return {
    name: "embed",
    types: ["embed"],
    process(request: { type: string }, ctx: RenderContext) {
      const { scope, content, scheduler } = request as Embed;

      let engine: Engine;

      if (scope !== ctx.scope) {
        // For cross-scope embeds, ensure an Engine exists for the target scope.
        const hub = ctx.engine.hub;
        const existing = hub.resolve(scope);
        if (existing) {
          engine = existing;
        } else {
          engine = hub.spawn(`embed-${scope.backend.name}-${Date.now()}`, scope, { scheduler });
          // Propagate errors from child engine to parent engine via dispatch
          const parentEngine = ctx.engine;
          engine.onError((error) => {
            hub.dispatch(parentEngine, {
              type: "engine:error",
              error,
              sourceEngineId: engine.id,
            });
          });
        }
      } else {
        // Same-scope embed — reuse the current engine.
        engine = ctx.engine;
      }

      // Always synchronous — embed is a structural rendering operation.
      // Cross-scope embeds render into the target scope's root, not the current parent.
      const parent = scope !== ctx.scope ? scope.backend.root : undefined;
      ctx.processChildren(content, { scope, parent });
      return engine;
    },
  };
}
