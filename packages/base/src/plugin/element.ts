/**
 * @ydant/base - Element processing
 */

import type { Render, RenderContext, Builder } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { Response } from "@ydant/core";
import type { Element, SvgElement, Attribute, Listener, Slot } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Executes pending mount callbacks on the next animation frame.
 * If a mount callback returns a cleanup function, it is added to unmountCallbacks.
 */
export function executeMount(ctx: RenderContext): void {
  const mountCallbacks = ctx.mountCallbacks;
  const unmountCallbacks = ctx.unmountCallbacks;

  ctx.schedule.scheduleCallback(() => {
    for (const callback of mountCallbacks) {
      const cleanup = callback();
      if (typeof cleanup === "function") {
        unmountCallbacks.push(cleanup);
      }
    }
    ctx.mountCallbacks = [];
  });
}

// =============================================================================
// processNode — shared logic for element/svg/shape processing
// =============================================================================

/** Options for {@link processNode}. */
export interface ProcessNodeOptions {
  key?: string | number;
  children: Render;
  createNode: (ctx: RenderContext) => unknown;
  applyDecorations?: (node: unknown, isReused: boolean, ctx: RenderContext) => void;
}

/**
 * Shared processing logic for element-like spell types (element, svg, shape).
 *
 * Creates (or reuses) a node, optionally applies decorations,
 * renders children, and returns a {@link Slot}.
 */
export function processNode(options: ProcessNodeOptions, ctx: RenderContext): Response {
  const elementKey = options.key ?? null;

  // Reuse existing node if a matching keyed element exists
  let node: unknown;
  let isReused = false;

  if (elementKey !== null && ctx.keyedNodes.get(elementKey)) {
    const existing = ctx.keyedNodes.get(elementKey)!;
    node = existing.node;
    isReused = true;

    // Carry over unmount callbacks from the previous lifecycle
    ctx.unmountCallbacks.push(...existing.unmountCallbacks);
    ctx.keyedNodes.delete(elementKey);
  } else {
    node = options.createNode(ctx);
  }

  // Append to parent (moves the node if reused)
  if (ctx.insertionRef !== undefined) {
    ctx.tree.insertBefore(ctx.parent, node, ctx.insertionRef);
  } else {
    ctx.tree.appendChild(ctx.parent, node);
  }

  // Apply inline decorations (attributes, listeners)
  options.applyDecorations?.(node, isReused, ctx);

  // Create a child-scoped context for this element
  const childCtx = ctx.createChildContext(node);
  childCtx.isCurrentElementReused = isReused;

  // Register in keyedNodes if keyed. The unmount callbacks array is populated
  // after child processing completes (see below).
  const unmountCallbacksRef: Array<() => void> = [];
  if (elementKey !== null) {
    ctx.keyedNodes.set(elementKey, {
      key: elementKey,
      node,
      unmountCallbacks: unmountCallbacksRef,
    });
  }

  // Create the Slot handle for this element
  const slot = createSlot(node, childCtx, unmountCallbacksRef);

  // Process children (clear first when reusing a keyed element)
  if (isReused) {
    ctx.tree.clearChildren(node);
  }

  if (options.children) {
    childCtx.processChildren(() => options.children as Render, {
      parent: node,
    });
  }

  // Collect child unmount callbacks so Slot.refresh() can clean them up
  const childUnmountCallbacks = childCtx.unmountCallbacks;
  unmountCallbacksRef.push(...childUnmountCallbacks);

  // Propagate to parent so ancestor refresh() also triggers cleanup
  ctx.unmountCallbacks.push(...unmountCallbacksRef);

  // Schedule mount callbacks for this element's subtree
  executeMount(childCtx);

  return slot;
}

// =============================================================================
// Spell-specific processors
// =============================================================================

/** Processes an {@link Element} request. */
export function processElement(element: Element, ctx: RenderContext): Response {
  return processNode(
    {
      key: element.key,
      children: element.children,
      createNode: (ctx) => ctx.tree.createElement(element.tag),
      applyDecorations: (node, isReused, ctx) =>
        applyDecorations(element.decorations, node, isReused, ctx),
    },
    ctx,
  );
}

/** Processes an {@link SvgElement} request. */
export function processSvg(element: SvgElement, ctx: RenderContext): Response {
  return processNode(
    {
      key: element.key,
      children: element.children,
      createNode: (ctx) => ctx.tree.createElementNS(SVG_NS, element.tag),
      applyDecorations: (node, isReused, ctx) =>
        applyDecorations(element.decorations, node, isReused, ctx),
    },
    ctx,
  );
}

// =============================================================================
// Decoration helpers
// =============================================================================

/**
 * Applies inline decorations to a node.
 *
 * Attributes are always (re-)applied. Listeners are only added on first render
 * to avoid duplicates — keyed element reuse assumes the same listeners persist.
 */
function applyDecorations(
  decorations: Array<Attribute | Listener> | undefined,
  node: unknown,
  isReused: boolean,
  ctx: RenderContext,
): void {
  if (!decorations) return;

  for (const decoration of decorations) {
    if (isTagged(decoration, "attribute")) {
      ctx.decorate.setAttribute(node, decoration.key, decoration.value);
    } else if (isTagged(decoration, "listener")) {
      // Listeners are skipped on reuse to prevent duplicates
      if (!isReused) {
        ctx.interact?.addEventListener(
          node,
          decoration.key,
          decoration.value as (e: unknown) => void,
        );
      }
    }
  }
}

// =============================================================================
// Slot
// =============================================================================

/** Maps a Slot to its refresh closure (set during createSlot). */
const refreshFns = new WeakMap<Slot, (builder: Builder) => void>();

/** Creates a {@link Slot} and registers its refresh closure. */
export function createSlot(
  node: unknown,
  childCtx: RenderContext,
  unmountCallbacksRef: Array<() => void>,
): Slot {
  const slot: Slot = { node };

  refreshFns.set(slot, (builder) => {
    // Get current unmount callbacks (includes cleanup functions added by executeMount)
    const currentUnmountCallbacks = childCtx.unmountCallbacks;

    // Run all unmount callbacks (both initial and cleanup functions), deduplicated
    const allCallbacks = new Set([...unmountCallbacksRef, ...currentUnmountCallbacks]);
    for (const callback of allCallbacks) {
      callback();
    }
    unmountCallbacksRef.length = 0;
    currentUnmountCallbacks.length = 0;

    // Remove all child nodes
    childCtx.tree.clearChildren(node);

    // Render new children
    childCtx.processChildren(builder, { parent: node });

    // Collect new unmount callbacks from the fresh render
    const newUnmountCallbacks = childCtx.unmountCallbacks;
    unmountCallbacksRef.push(...newUnmountCallbacks);

    // Schedule mount callbacks
    executeMount(childCtx);
  });

  return slot;
}

/** Replaces a Slot's children by running a new Builder. */
export function refresh(slot: Slot, builder: Builder): void {
  const fn = refreshFns.get(slot);
  if (fn) fn(builder);
}
