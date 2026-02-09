/**
 * @ydant/base - Module augmentation
 *
 * Extends core interfaces (RenderContext, DSLSchema) with
 * the properties required by the base plugin.
 */

import type { Element, Attribute, Listener, Text, Lifecycle, Slot, KeyedNode } from "./types";

declare module "@ydant/core" {
  interface RenderContext {
    /** Whether the current element was reused via key matching (prevents duplicate listeners/lifecycle). */
    isCurrentElementReused: boolean;
    /** Lookup map of keyed elements available for reuse. */
    keyedNodes: Map<string | number, KeyedNode>;
    /** Callbacks to run after the component is mounted to the DOM. */
    mountCallbacks: Array<() => void | (() => void)>;
    /** Callbacks to run when the component is unmounted from the DOM. */
    unmountCallbacks: Array<() => void>;
  }

  // Register base DSL types. The "element" entry's feedback (Slot) also
  // becomes the return type via the feedback fallback in DSLSchema.
  interface DSLSchema {
    element: { instruction: Element; feedback: Slot };
    attribute: { instruction: Attribute };
    listener: { instruction: Listener };
    text: { instruction: Text };
    lifecycle: { instruction: Lifecycle };
  }
}
