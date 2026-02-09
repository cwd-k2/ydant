/**
 * @ydant/base - Element processing
 */

import type { Builder, Render } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { RenderAPI, ProcessResult } from "@ydant/core";
import type { Element, Slot } from "../types";

/** Processes an {@link Element} instruction: creates (or reuses) a DOM node, applies decorations, renders children, and returns a {@link Slot}. */
export function processElement(element: Element, api: RenderAPI): ProcessResult {
  const elementKey = element.key ?? null;

  // Reuse existing node if a matching keyed element exists
  let node: globalThis.Element;
  let isReused = false;

  if (elementKey !== null && api.getKeyedNode(elementKey)) {
    const existing = api.getKeyedNode(elementKey)!;
    node = existing.node;
    isReused = true;

    // Carry over unmount callbacks from the previous lifecycle
    api.addUnmountCallbacks(...existing.unmountCallbacks);
    api.deleteKeyedNode(elementKey);
  } else {
    node = element.ns
      ? document.createElementNS(element.ns, element.tag)
      : document.createElement(element.tag);
  }

  // Append to parent (moves the node if reused)
  api.appendChild(node);

  // Apply inline decorations (attributes, listeners)
  applyDecorations(element, node, isReused);

  // Create a child-scoped API for this element
  const childApi = api.createChildAPI(node);

  // Register in keyedNodes if keyed. The unmount callbacks array is populated
  // after child processing completes (see below).
  const unmountCallbacksRef: Array<() => void> = [];
  if (elementKey !== null) {
    api.setKeyedNode(elementKey, {
      key: elementKey,
      node,
      unmountCallbacks: unmountCallbacksRef,
    });
  }

  // Create the Slot handle for this element
  const slot = createSlot(node, childApi, unmountCallbacksRef);

  // Process children (clear first when reusing a keyed element)
  if (isReused) {
    node.innerHTML = "";
  }

  if (element.children) {
    childApi.processChildren(() => element.children as Render, {
      parent: node,
    });
  }

  // Collect child unmount callbacks so Slot.refresh() can clean them up
  const childUnmountCallbacks = childApi.getUnmountCallbacks();
  unmountCallbacksRef.push(...childUnmountCallbacks);

  // Propagate to parent so ancestor refresh() also triggers cleanup
  api.addUnmountCallbacks(...unmountCallbacksRef);

  // Schedule mount callbacks for this element's subtree
  childApi.executeMount();

  return { value: slot };
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
  childApi: RenderAPI,
  unmountCallbacksRef: Array<() => void>,
): Slot {
  return {
    node: node as HTMLElement,
    refresh(builder: Builder) {
      // Get current unmount callbacks (includes cleanup functions added by executeMount)
      const currentUnmountCallbacks = childApi.getUnmountCallbacks();

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
      childApi.processChildren(builder, { parent: node });

      // Collect new unmount callbacks from the fresh render
      const newUnmountCallbacks = childApi.getUnmountCallbacks();
      unmountCallbacksRef.push(...newUnmountCallbacks);

      // Schedule mount callbacks
      childApi.executeMount();
    },
  };
}
