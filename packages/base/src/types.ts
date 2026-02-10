/**
 * @ydant/base - DSL type definitions
 */

import type { Tagged, Render, Builder } from "@ydant/core";

// =============================================================================
// Slot Types
// =============================================================================

/**
 * A handle to a mounted DOM element, providing access to its node
 * and the ability to re-render its children.
 */
export interface Slot {
  /** The underlying DOM element. */
  readonly node: HTMLElement;
  /** Replaces the element's children by running a new {@link Builder}. */
  refresh(children: Builder): void;
}

// =============================================================================
// Core Primitive Types
// =============================================================================

/** Sets an HTML attribute on the current element. */
export type Attribute = Tagged<"attribute", { key: string; value: string }>;

/** Attaches a DOM event listener to the current element. */
export type Listener = Tagged<"listener", { key: string; value: (e: Event) => void }>;

/** Creates a text node and appends it to the current parent. */
export type Text = Tagged<"text", { content: string }>;

/** A lifecycle hook that runs when the component is mounted. May return a cleanup function. */
type MountLifecycle = Tagged<
  "lifecycle",
  {
    event: "mount";
    callback: () => void | (() => void);
  }
>;

/** A lifecycle hook that runs when the component is unmounted. */
type UnmountLifecycle = Tagged<
  "lifecycle",
  {
    event: "unmount";
    callback: () => void;
  }
>;

/** A lifecycle hook — either {@link MountLifecycle} or {@link UnmountLifecycle}. */
export type Lifecycle = MountLifecycle | UnmountLifecycle;

// =============================================================================
// Plugin Types
// =============================================================================

/** Tracks a keyed element's DOM node and its associated unmount callbacks for reuse. */
export interface KeyedNode {
  key: string | number;
  node: globalThis.Element;
  unmountCallbacks: Array<() => void>;
}

// =============================================================================
// Element Types
// =============================================================================

/** A DSL instruction that creates a DOM element with children and optional decorations. */
export type Element = Tagged<
  "element",
  {
    tag: string;
    children: Render;
    decorations?: Array<Attribute | Listener>;
    key?: string | number;
    ns?: string;
  }
>;
