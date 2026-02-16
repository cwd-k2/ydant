/**
 * @ydant/core - Embed spell and plugin
 *
 * Allows switching execution scopes within a render tree.
 * This is the mechanism for embedding one rendering environment
 * inside another (e.g., Canvas inside DOM).
 *
 * Same-scope embeds execute synchronously (same engine).
 * Cross-scope embeds enqueue work on the target engine.
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

      if (scope === ctx.scope) {
        // Same scope — synchronous (same engine)
        ctx.processChildren(content, { scope });
      } else {
        // Cross-scope — resolve or spawn target engine, then enqueue
        const hub = ctx.engine.hub;
        let target = hub.resolve(scope);
        if (!target) {
          target = hub.spawn(`embed-${scope.backend.name}-${Date.now()}`, scope);
        }
        target.enqueue(() => ctx.processChildren(content, { scope }));
      }

      return undefined;
    },
  };
}
