/**
 * @ydant/base - Module augmentation
 *
 * Extends core interfaces (RenderContext, RenderAPI, DSLSchema) with
 * the properties and methods required by the base plugin.
 */

import type { Builder, RenderAPI } from "@ydant/core";
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

  interface RenderAPI {
    // === DOM manipulation ===
    /** The current parent node that children are appended to. */
    readonly parent: Node;
    /** The element currently being decorated, or `null` between elements. */
    readonly currentElement: globalThis.Element | null;
    /** Sets the element currently being decorated. */
    setCurrentElement(element: globalThis.Element | null): void;
    /** Changes the current parent node. */
    setParent(parent: Node): void;
    /** Appends a node to the current parent. */
    appendChild(node: Node): void;

    // === Lifecycle ===
    /** Registers a callback to run after mount. May return a cleanup function. */
    onMount(callback: () => void | (() => void)): void;
    /** Registers a callback to run on unmount. */
    onUnmount(callback: () => void): void;
    /** Adds multiple unmount callbacks at once. */
    addUnmountCallbacks(...callbacks: Array<() => void>): void;
    /** Schedules execution of pending mount callbacks (via requestAnimationFrame). */
    executeMount(): void;
    /** Returns the current context's unmount callback array. */
    getUnmountCallbacks(): Array<() => void>;

    // === Child processing ===
    /** Processes a {@link Builder}'s instructions in a new child context. */
    processChildren(
      builder: Builder,
      options?: {
        parent?: Node;
        inheritContext?: boolean;
      },
    ): void;
    /** Creates a new child-scoped {@link RenderAPI} for the given parent node. */
    createChildAPI(parent: Node): RenderAPI;

    // === Keyed elements ===
    /** Whether the current element was reused from a previous render via key matching. */
    readonly isCurrentElementReused: boolean;
    /** Sets the element-reuse flag for the current context. */
    setCurrentElementReused(reused: boolean): void;
    /** Retrieves a keyed node by its key, or `undefined` if not found. */
    getKeyedNode(key: string | number): KeyedNode | undefined;
    /** Stores a keyed node for potential reuse in future renders. */
    setKeyedNode(key: string | number, node: KeyedNode): void;
    /** Removes a keyed node from the reuse map. */
    deleteKeyedNode(key: string | number): void;
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
