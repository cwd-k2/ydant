/**
 * @ydant/base - Element processing
 */

import type { Render, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { Response } from "@ydant/core";
import type { Element, Slot } from "../types";

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

/** Processes an {@link Element} request: creates (or reuses) a node, applies decorations, renders children, and returns a {@link Slot}. */
export function processElement(element: Element, ctx: RenderContext): Response {
  const elementKey = element.key ?? null;

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
    node = element.ns
      ? ctx.tree.createElementNS(element.ns, element.tag)
      : ctx.tree.createElement(element.tag);
  }

  // Append to parent (moves the node if reused)
  ctx.tree.appendChild(ctx.parent, node);

  // Apply inline decorations (attributes, listeners)
  applyDecorations(element, node, isReused, ctx);

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

  if (element.children) {
    childCtx.processChildren(() => element.children as Render, {
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

/**
 * Applies inline decorations to a node.
 *
 * Attributes are always (re-)applied. Listeners are only added on first render
 * to avoid duplicates — keyed element reuse assumes the same listeners persist.
 */
function applyDecorations(
  element: Element,
  node: unknown,
  isReused: boolean,
  ctx: RenderContext,
): void {
  if (!element.decorations) return;

  for (const decoration of element.decorations) {
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

/** Creates a {@link Slot} that can re-render its children and manage unmount callbacks. */
export function createSlot(
  node: unknown,
  childCtx: RenderContext,
  unmountCallbacksRef: Array<() => void>,
): Slot {
  return {
    node,
    refresh(builder) {
      // Get current unmount callbacks (includes cleanup functions added by executeMount)
      const currentUnmountCallbacks = childCtx.unmountCallbacks;

      // Run all unmount callbacks (both initial and cleanup functions), deduplicated
      const allCallbacks = new Set([...unmountCallbacksRef, ...currentUnmountCallbacks]);
      for (const callback of allCallbacks) {
        callback();
      }
      unmountCallbacksRef.length = 0;

      // Remove all child nodes
      childCtx.tree.clearChildren(node);

      // Render new children
      childCtx.processChildren(builder, { parent: node });

      // Collect new unmount callbacks from the fresh render
      const newUnmountCallbacks = childCtx.unmountCallbacks;
      unmountCallbacksRef.push(...newUnmountCallbacks);

      // Schedule mount callbacks
      executeMount(childCtx);
    },
  };
}
