/**
 * @ydant/base - Element processing
 */

import type { Render, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { Feedback } from "@ydant/core";
import type { Element, Slot } from "../types";
import { executeMount } from "./index";

/** Processes an {@link Element} instruction: creates (or reuses) a DOM node, applies decorations, renders children, and returns a {@link Slot}. */
export function processElement(element: Element, ctx: RenderContext): Feedback {
  const elementKey = element.key ?? null;

  // Reuse existing node if a matching keyed element exists
  let node: globalThis.Element;
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
      ? document.createElementNS(element.ns, element.tag)
      : document.createElement(element.tag);
  }

  // Append to parent (moves the node if reused)
  ctx.parent.appendChild(node);

  // Apply inline decorations (attributes, listeners)
  applyDecorations(element, node, isReused);

  // Create a child-scoped context for this element
  const childCtx = ctx.createChildContext(node);

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
    node.innerHTML = "";
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
 * Applies inline decorations to a DOM node.
 *
 * Attributes are always (re-)applied. Listeners are only added on first render
 * to avoid duplicates — keyed element reuse assumes the same listeners persist.
 */
function applyDecorations(element: Element, node: globalThis.Element, isReused: boolean): void {
  if (!element.decorations) return;

  for (const decoration of element.decorations) {
    if (isTagged(decoration, "attribute")) {
      // Attributes are always applied (overwritten with new value)
      node.setAttribute(decoration.key as string, decoration.value as string);
    } else if (isTagged(decoration, "listener")) {
      // Listeners are skipped on reuse to prevent duplicates
      if (!isReused) {
        node.addEventListener(decoration.key as string, decoration.value as (e: Event) => void);
      }
    }
  }
}

/** Creates a {@link Slot} that can re-render its children and manage unmount callbacks. */
function createSlot(
  node: globalThis.Element,
  childCtx: RenderContext,
  unmountCallbacksRef: Array<() => void>,
): Slot {
  return {
    node: node as HTMLElement,
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
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

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
