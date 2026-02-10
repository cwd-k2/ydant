/**
 * @ydant/core - RenderContext management
 */

import type { Builder, Render } from "../types";
import { toRender } from "../utils";
import type { Plugin, RenderContext } from "../plugin";

/**
 * Iterates over registered plugins, calling each one exactly once.
 * A plugin registered for multiple type tags is only visited once.
 */
function forEachUniquePlugin(
  plugins: Map<string, Plugin>,
  callback: (plugin: Plugin) => void,
): void {
  const visited = new Set<string>();
  for (const plugin of plugins.values()) {
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
    parent: Node,
    currentElement: globalThis.Element | null,
    plugins: Map<string, Plugin>,
    parentCtx?: RenderContext,
  ): RenderContext {
    const ctx = {
      parent,
      currentElement,
      plugins,
    } as RenderContext;

    // Core-provided methods (capture processIterator via closure)
    ctx.processChildren = (builder: Builder, options?: { parent?: Node }): void => {
      const targetParent = options?.parent ?? ctx.parent;

      const childCtx = createRenderContext(
        targetParent,
        targetParent instanceof globalThis.Element ? targetParent : null,
        ctx.plugins,
        ctx,
      );

      const children = toRender(builder());
      processIterator(children, childCtx);

      // Propagate child state back to parent
      forEachUniquePlugin(ctx.plugins, (plugin) => {
        plugin.mergeChildContext?.(ctx, childCtx);
      });
    };

    ctx.createChildContext = (parent: Node): RenderContext => {
      return createRenderContext(
        parent,
        parent instanceof globalThis.Element ? parent : null,
        ctx.plugins,
        ctx,
      );
    };

    // Let each plugin initialize its properties on the context
    forEachUniquePlugin(plugins, (plugin) => {
      plugin.initContext?.(ctx, parentCtx);
    });

    return ctx;
  }

  return createRenderContext;
}
