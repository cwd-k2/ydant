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
import type { ExecutionScope, Plugin, RenderContext } from "./plugin";

// =============================================================================
// Types
// =============================================================================

/** An embed request — renders children under a different {@link ExecutionScope}. */
export type Embed = Tagged<"embed", { scope: ExecutionScope; content: Builder }>;

// =============================================================================
// Spell
// =============================================================================

/** Renders children under a different execution scope. Use with `yield*`. */
export function* embed(scope: ExecutionScope, content: Builder): Spell<"embed"> {
  yield { type: "embed", scope, content } as Embed;
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
      const { scope, content } = request as Embed;

      // For cross-scope embeds, ensure an Engine exists for the target scope
      // so that reactive updates within the embedded scope can use it later.
      if (scope !== ctx.scope) {
        const hub = ctx.engine.hub;
        if (!hub.resolve(scope)) {
          hub.spawn(`embed-${scope.backend.name}-${Date.now()}`, scope);
        }
      }

      // Always synchronous — embed is a structural rendering operation.
      // Cross-scope embeds render into the target scope's root, not the current parent.
      const parent = scope !== ctx.scope ? scope.backend.root : undefined;
      ctx.processChildren(content, { scope, parent });
      return undefined;
    },
  };
}
