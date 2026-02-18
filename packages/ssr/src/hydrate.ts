/**
 * @ydant/ssr - Hydration
 *
 * SSR で出力した HTML に対してクライアント側でイベントリスナーや
 * Slot 参照を接続する。
 *
 * 同じ DSL (yield* div(...) 等) を「ノード作成」ではなく
 * 「既存ノードの取得」として読み替えることで hydration を実現する。
 * この「読み替え」は Plugin レベルで行い、ノード取得の能力は
 * Resolve capability が提供する。
 */

import type {
  Component,
  Plugin,
  MountHandle,
  RenderContext,
  ResolveCapability,
  Render,
  Response,
  Request,
} from "@ydant/core";
import { scope, isTagged } from "@ydant/core";
import { createDOMBackend, createBasePlugin, executeMount, createSlot } from "@ydant/base";
import type { Element } from "@ydant/base";
import { createDOMNodeResolver } from "./resolver";

declare const process: undefined | { env?: { NODE_ENV?: string } };
const DEV = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

export interface HydrateOptions {
  /** Additional plugins (reactive, context, etc.). Base plugin is handled internally. */
  plugins?: Plugin[];
}

/**
 * Hydrates server-rendered HTML by walking existing DOM nodes and
 * attaching event listeners and Slot references.
 *
 * Uses the same component tree as `renderToString`. Instead of creating
 * new DOM nodes, finds and reuses existing ones.
 *
 * @param app - The root component (same one used for SSR).
 * @param root - The DOM element containing the server-rendered HTML.
 * @param options - Additional plugins to register.
 * @returns A mount handle for disposal.
 */
export function hydrate(app: Component, root: HTMLElement, options?: HydrateOptions): MountHandle {
  const resolver = createDOMNodeResolver();
  const hydrationPlugin = createHydrationPlugin(resolver);
  const extraPlugins = options?.plugins ?? [];

  return scope(createDOMBackend(root, { skipPrepare: true }), [
    hydrationPlugin,
    ...extraPlugins,
  ]).mount(app);
}

// =============================================================================
// Hydration Plugin
// =============================================================================

/**
 * Creates a plugin that wraps the base plugin with hydration behavior.
 *
 * During the initial render pass (hydration):
 * - Element requests: acquire existing DOM node via resolver (skip create + append)
 * - Text requests: advance resolver cursor (skip create + append)
 * - Attribute requests: skip (already set by SSR)
 * - Listener requests: apply (this is the purpose of hydration)
 * - Lifecycle requests: apply (mount hooks may initialize state)
 *
 * After setup() is called (initial render complete), all requests
 * delegate to the base plugin for normal DOM rendering.
 */
export function createHydrationPlugin(resolver: ResolveCapability): Plugin {
  const base = createBasePlugin();
  let hydrating = true;

  return {
    name: "base",
    types: base.types,

    setup(ctx: RenderContext) {
      hydrating = false;
      base.setup?.(ctx);
    },

    teardown(ctx: RenderContext) {
      base.teardown?.(ctx);
    },

    initContext(ctx: RenderContext, parentCtx?: RenderContext) {
      base.initContext?.(ctx, parentCtx);
      ctx.resolve = resolver;
    },

    mergeChildContext(parentCtx: RenderContext, childCtx: RenderContext) {
      base.mergeChildContext?.(parentCtx, childCtx);
    },

    process(request: Request, ctx: RenderContext): Response {
      if (!hydrating) {
        return base.process?.(request, ctx);
      }

      // --- Hydration mode: reinterpret the DSL ---

      if (isTagged(request, "element")) {
        return hydrateElement(request, ctx, resolver);
      }

      if (isTagged(request, "text")) {
        // Text node already exists in DOM. Advance cursor to stay in sync.
        const textNode = resolver.nextChild(ctx.parent);
        if (DEV) {
          if (textNode === null) {
            console.warn(
              "[ydant] Hydration mismatch: expected a text node but no more children exist in the DOM.",
            );
          } else if ((textNode as Node).nodeType !== 3) {
            console.warn(
              `[ydant] Hydration mismatch: expected a text node but found <${((textNode as Node).nodeName ?? "unknown").toLowerCase()}>.`,
            );
          }
        }
        return;
      }

      if (isTagged(request, "attribute")) {
        // Attributes are already set by SSR HTML. Skip.
        return;
      }

      // Listeners and lifecycle: apply normally (delegate to base).
      // Listeners are the primary reason hydration exists.
      // Lifecycle mount hooks may initialize client-side state.
      return base.process?.(request, ctx);
    },
  };
}

// =============================================================================
// Hydrating Element Processing
// =============================================================================

/**
 * Hydration version of processElement.
 *
 * Instead of createElement + appendChild, acquires the existing node
 * from the resolver. Children are processed recursively (still in
 * hydration mode). The returned Slot's refresh() uses normal rendering
 * (since hydrating will be false by the time refresh is called).
 */
function hydrateElement(
  element: Element,
  ctx: RenderContext,
  resolver: ResolveCapability,
): Response {
  // Acquire existing node instead of creating
  const node = resolver.nextChild(ctx.parent);

  if (node === null) {
    if (DEV) {
      console.warn(
        `[ydant] Hydration mismatch: expected <${element.tag}> but no more children exist in the DOM.`,
      );
    }
    return;
  }

  if (DEV) {
    if ((node as Node).nodeType !== 1) {
      console.warn(
        `[ydant] Hydration mismatch: expected <${element.tag}> but found a non-element node (type=${(node as Node).nodeType}).`,
      );
    } else if ((node as globalThis.Element).localName !== element.tag) {
      console.warn(
        `[ydant] Hydration mismatch: expected <${element.tag}> but found <${(node as globalThis.Element).localName}>.`,
      );
    }
  }

  // Apply only listeners from decorations (attributes already set by SSR)
  if (element.decorations) {
    for (const decoration of element.decorations) {
      if (isTagged(decoration, "listener")) {
        ctx.interact?.addEventListener(
          node,
          decoration.key,
          decoration.value as (e: unknown) => void,
        );
      }
    }
  }

  // Create child context for this element's subtree
  const childCtx = ctx.createChildContext(node);

  // Register keyed element for future Slot.refresh reuse
  const elementKey = element.key ?? null;
  const unmountCallbacksRef: Array<() => void> = [];
  if (elementKey !== null) {
    ctx.keyedNodes.set(elementKey, {
      key: elementKey,
      node: node as globalThis.Element,
      unmountCallbacks: unmountCallbacksRef,
    });
  }

  // Reuse base's createSlot — refresh() will use normal rendering
  // (hydrating is false after setup(), which runs after initial render)
  const slot = createSlot(node, childCtx, unmountCallbacksRef);

  // Process children (still in hydration mode — walks existing subtree)
  if (element.children) {
    childCtx.processChildren(() => element.children as Render, {
      parent: node,
    });
  }

  // Collect and propagate unmount callbacks
  const childUnmountCallbacks = childCtx.unmountCallbacks;
  unmountCallbacksRef.push(...childUnmountCallbacks);
  ctx.unmountCallbacks.push(...unmountCallbacksRef);

  // Schedule mount callbacks for this element's subtree
  executeMount(childCtx);

  return slot;
}
