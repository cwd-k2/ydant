/**
 * @ydant/core - RenderContext management
 */

import type { Builder, Render } from "../types";
import { toRender } from "../utils";
import type { ExecutionScope, Plugin, RenderContext } from "../plugin";

/**
 * Iterates over registered plugins, calling each one exactly once.
 */
function forEachUniquePlugin(plugins: readonly Plugin[], callback: (plugin: Plugin) => void): void {
  const visited = new Set<string>();
  for (const plugin of plugins) {
    if (visited.has(plugin.name)) continue;
    visited.add(plugin.name);
    callback(plugin);
  }
}

/**
 * Returns a factory that builds a fully initialized {@link RenderContext}.
 *
 * Structured as a higher-order function so that `processChildren` can
 * capture the `processIterator` function via closure, breaking the
 * circular dependency between this module and `iterator.ts`.
 */
export function createRenderContextFactory(
  processIterator: (iter: Render, ctx: RenderContext) => void,
) {
  function createRenderContext(
    scope: ExecutionScope,
    parent?: unknown,
    parentCtx?: RenderContext,
  ): RenderContext {
    const actualParent = parent ?? scope.backend.root;

    const ctx = {
      parent: actualParent,
      scope,
    } as RenderContext;

    // Core-provided methods (capture scope via closure)
    ctx.processChildren = (
      builder: Builder,
      options?: { parent?: unknown; scope?: ExecutionScope },
    ): void => {
      const targetParent = options?.parent ?? ctx.parent;
      const targetScope = options?.scope ?? ctx.scope;

      const childCtx = createRenderContext(targetScope, targetParent, ctx);

      const children = toRender(builder());
      processIterator(children, childCtx);

      // Propagate child state back to parent using the parent's plugins
      forEachUniquePlugin(ctx.scope.allPlugins, (plugin) => {
        plugin.mergeChildContext?.(ctx, childCtx);
      });
    };

    ctx.createChildContext = (parent: unknown): RenderContext => {
      return createRenderContext(ctx.scope, parent, ctx);
    };

    // Let the backend initialize capability properties first
    scope.backend.initContext(ctx);

    // Then let each plugin initialize its properties on the context
    forEachUniquePlugin(scope.allPlugins, (plugin) => {
      plugin.initContext?.(ctx, parentCtx);
    });

    return ctx;
  }

  return createRenderContext;
}
