/**
 * @ydant/base - Primitive processing
 */

import type { RenderContext } from "@ydant/core";
import type { Text, Lifecycle } from "../types";

/** Creates a text node from a {@link Text} instruction and appends it to the parent. */
export function processText(text: Text, ctx: RenderContext): void {
  const textNode = ctx.tree.createTextNode(text.content);
  if (ctx.insertionRef !== undefined) {
    ctx.tree.insertBefore(ctx.parent, textNode, ctx.insertionRef);
  } else {
    ctx.tree.appendChild(ctx.parent, textNode);
  }
}

/** Registers a {@link Lifecycle} callback (mount or unmount). Skipped when the element is reused. */
export function processLifecycle(lifecycle: Lifecycle, ctx: RenderContext): void {
  // Skip on reused elements to prevent duplicate callbacks
  if (ctx.isCurrentElementReused) {
    return;
  }

  if (lifecycle.event === "mount") {
    ctx.mountCallbacks.push(lifecycle.callback);
  } else if (lifecycle.event === "unmount") {
    ctx.unmountCallbacks.push(lifecycle.callback as () => void);
  }
}
