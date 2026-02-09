/**
 * @ydant/core - RenderContext management
 */

import type { Builder, Render } from "../types";
import { toRender } from "../utils";
import type { Plugin, RenderAPI } from "../plugin";
import type { RenderContext } from "./types";

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

/** Creates a bare {@link RenderContext} with only core fields. Plugin properties are added by {@link Plugin.initContext}. */
function createRenderContextBase(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
): RenderContext {
  return {
    parent,
    currentElement,
    plugins,
  } as RenderContext;
}

/**
 * Creates a fully initialized {@link RenderContext} by constructing the base
 * and running each plugin's `initContext` hook.
 *
 * @param parent - The parent DOM node.
 * @param currentElement - The element being decorated, or `null`.
 * @param plugins - Registered plugins.
 * @param parentCtx - The parent context (for child context creation), or `undefined` at root.
 */
export function createRenderContext(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
  parentCtx?: RenderContext,
): RenderContext {
  const ctx = createRenderContextBase(parent, currentElement, plugins);

  // Let each plugin initialize its properties on the context
  forEachUniquePlugin(plugins, (plugin) => {
    plugin.initContext?.(ctx, parentCtx);
  });

  return ctx;
}

/**
 * Returns a factory that builds a {@link RenderAPI} from a {@link RenderContext}.
 *
 * Structured as a higher-order function to break the circular dependency
 * between this module and `processIterator`.
 *
 * The core provides only `parent`, `currentElement`, `processChildren`, and
 * `createChildAPI`. Plugin-specific methods are added via {@link Plugin.extendAPI}.
 */
export function createRenderAPIFactory(
  processIterator: (iter: Render, ctx: RenderContext) => void,
) {
  return function createRenderAPI(ctx: RenderContext): RenderAPI {
    // Return cached API if available
    if (ctx._cachedAPI) {
      return ctx._cachedAPI;
    }

    const api: Record<string, unknown> = {
      // ========================================================================
      // Core API (plugins extend on top of these)
      // ========================================================================
      get parent() {
        return ctx.parent;
      },
      get currentElement() {
        return ctx.currentElement;
      },
      processChildren(
        builder: Builder,
        options?: { parent?: Node; inheritContext?: boolean },
      ): void {
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
      },
      createChildAPI(parent: Node): RenderAPI {
        const childCtx = createRenderContext(
          parent,
          parent instanceof globalThis.Element ? parent : null,
          ctx.plugins,
          ctx,
        );
        return createRenderAPI(childCtx);
      },
    };

    // Let each plugin add its methods to the API
    forEachUniquePlugin(ctx.plugins, (plugin) => {
      plugin.extendAPI?.(api as Partial<RenderAPI>, ctx);
    });

    const renderAPI = api as unknown as RenderAPI;
    ctx._cachedAPI = renderAPI;
    return renderAPI;
  };
}
