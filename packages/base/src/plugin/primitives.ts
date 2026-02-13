/**
 * @ydant/base - Primitive processing
 */

import type { RenderContext } from "@ydant/core";
import type { Attribute, Listener, Text, Lifecycle } from "../types";

/** Applies an {@link Attribute} to the current element via the decorate capability. */
export function processAttribute(attr: Attribute, ctx: RenderContext): void {
  const element = ctx.currentElement;
  if (element) {
    ctx.decorate.setAttribute(element, attr.key, attr.value);
  }
}

/** Attaches a {@link Listener} to the current element. Skipped when the element is reused to avoid duplicates. */
export function processListener(listener: Listener, ctx: RenderContext): void {
  // Skip on reused elements to prevent duplicate listeners
  if (ctx.isCurrentElementReused) {
    return;
  }

  const element = ctx.currentElement;
  if (element) {
    ctx.interact.addEventListener(element, listener.key, listener.value as (e: unknown) => void);
  }
}

/** Creates a text node from a {@link Text} instruction and appends it to the parent. */
export function processText(text: Text, ctx: RenderContext): void {
  const textNode = ctx.tree.createTextNode(text.content);
  ctx.tree.appendChild(ctx.parent, textNode);
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
