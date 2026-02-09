/**
 * @ydant/base - DSL type definitions
 */

import type { Tagged, CleanupFn, Instructor, Builder, ChildNext } from "@ydant/core";

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
// Render & Component Types
// =============================================================================

/**
 * The return type of element factories (e.g., `div`, `span`).
 *
 * A generator that yields exactly one {@link Element} and returns a {@link Slot}.
 * More specific than the generic `Render` type — guarantees that `yield* div(...)`
 * always produces a `Slot`.
 */
export type ElementRender = Generator<Element, Slot, ChildNext>;

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
export type MountLifecycle = Tagged<
  "lifecycle",
  {
    event: "mount";
    callback: () => void | CleanupFn;
  }
>;

/** A lifecycle hook that runs when the component is unmounted. */
export type UnmountLifecycle = Tagged<
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

/** An inline decoration applied during element creation — either an {@link Attribute} or {@link Listener}. */
export type Decoration = Attribute | Listener;

/** A DSL instruction that creates a DOM element with children and optional decorations. */
export type Element = Tagged<
  "element",
  {
    tag: string;
    children: Instructor;
    decorations?: Decoration[];
    key?: string | number;
    ns?: string;
  }
>;
