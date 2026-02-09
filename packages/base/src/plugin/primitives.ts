/**
 * @ydant/base - Primitive processing
 */

import type { RenderAPI, ProcessResult } from "@ydant/core";
import type { Attribute, Listener, Text, Lifecycle } from "../types";

/** Applies an {@link Attribute} to the current element via `setAttribute`. */
export function processAttribute(attr: Attribute, api: RenderAPI): ProcessResult {
  const element = api.currentElement;
  if (element) {
    element.setAttribute(attr.key, attr.value);
  }
  return {};
}

/** Attaches a {@link Listener} to the current element. Skipped when the element is reused to avoid duplicates. */
export function processListener(listener: Listener, api: RenderAPI): ProcessResult {
  // Skip on reused elements to prevent duplicate listeners
  if (api.isCurrentElementReused) {
    return {};
  }

  const element = api.currentElement;
  if (element) {
    element.addEventListener(listener.key, listener.value);
  }
  return {};
}

/** Creates a DOM text node from a {@link Text} instruction and appends it to the parent. */
export function processText(text: Text, api: RenderAPI): ProcessResult {
  const textNode = document.createTextNode(text.content);
  api.appendChild(textNode);
  return {};
}

/** Registers a {@link Lifecycle} callback (mount or unmount). Skipped when the element is reused. */
export function processLifecycle(lifecycle: Lifecycle, api: RenderAPI): ProcessResult {
  // Skip on reused elements to prevent duplicate callbacks
  if (api.isCurrentElementReused) {
    return {};
  }

  if (lifecycle.event === "mount") {
    api.onMount(lifecycle.callback);
  } else if (lifecycle.event === "unmount") {
    api.onUnmount(lifecycle.callback as () => void);
  }
  return {};
}
