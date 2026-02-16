/**
 * @ydant/ssr - DOM Node Resolver
 *
 * Provides a DOM-based implementation of {@link ResolveCapability}.
 * Walks existing child nodes of a parent using a cursor,
 * enabling hydration to reuse server-rendered DOM nodes.
 */

import type { ResolveCapability } from "@ydant/core";

/**
 * Creates a {@link ResolveCapability} backed by the browser DOM.
 *
 * Each parent node has its own cursor position (tracked via WeakMap).
 * Successive calls to `nextChild(parent)` return `childNodes[0]`,
 * `childNodes[1]`, etc.
 */
export function createDOMNodeResolver(): ResolveCapability {
  const cursors = new WeakMap<object, number>();

  return {
    nextChild(parent: unknown): unknown | null {
      const node = parent as Node;
      const index = cursors.get(node) ?? 0;
      cursors.set(node, index + 1);
      return node.childNodes[index] ?? null;
    },
  };
}
