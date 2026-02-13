/**
 * @ydant/base - Module augmentation
 *
 * Extends core interfaces (RenderContext, SpellSchema) with
 * the properties required by the base plugin and capability providers.
 */

import type { Element, Attribute, Listener, Text, Lifecycle, Slot, KeyedNode } from "./types";
import type {
  TreeCapability,
  DecorateCapability,
  InteractCapability,
  ScheduleCapability,
} from "./capabilities";

declare module "@ydant/core" {
  interface RenderContext {
    // --- Capabilities (injected by capability providers) ---

    /** Tree operations: create nodes and assemble parent-child relationships. */
    tree: TreeCapability;
    /** Decoration operations: set attributes on nodes. */
    decorate: DecorateCapability;
    /** Interaction operations: attach event listeners to nodes. */
    interact: InteractCapability;
    /** Scheduling operations: defer callbacks (e.g., mount hooks). */
    schedule: ScheduleCapability;
    /** The element currently being decorated, or `null` between elements. */
    currentElement: unknown;

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
    element: { request: Element; response: Slot };
    attribute: { request: Attribute };
    listener: { request: Listener };
    text: { request: Text };
    lifecycle: { request: Lifecycle };
  }
}
