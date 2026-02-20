/**
 * @ydant/base - Module augmentation
 *
 * Extends core interfaces (RenderContext, SpellSchema) with
 * the properties required by the base plugin.
 *
 * Capability fields (tree, decorate, interact, schedule, currentElement)
 * are declared in @ydant/core's global.d.ts.
 */

import type { Element, SvgElement, Text, Lifecycle, Slot, KeyedNode } from "./types";

declare module "@ydant/core" {
  interface RenderContext {
    // --- Base plugin state ---

    /** Whether the current element was reused via key matching (prevents duplicate listeners/lifecycle). */
    isCurrentElementReused: boolean;
    /** Lookup map of keyed elements available for reuse. */
    keyedNodes: Map<string | number, KeyedNode>;
    /** Callbacks to run after the component is mounted to the DOM. */
    mountCallbacks: Array<() => void | (() => void)>;
    /** Callbacks to run when the component is unmounted from the DOM. */
    unmountCallbacks: Array<() => void>;
  }

  // Register base spell types. The "element" entry's response (Slot) also
  // becomes the return type via the response fallback in SpellSchema.
  interface SpellSchema {
    element: { request: Element; response: Slot; capabilities: "tree" | "decorate" };
    svg: { request: SvgElement; response: Slot; capabilities: "tree" | "decorate" };
    text: { request: Text; capabilities: "tree" };
    lifecycle: { request: Lifecycle; capabilities: "schedule" };
  }
}
