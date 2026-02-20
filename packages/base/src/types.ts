/**
 * @ydant/base - DSL type definitions
 */

import type { Tagged, Render, Builder, Spell } from "@ydant/core";

// =============================================================================
// Slot Types
// =============================================================================

/**
 * A handle to a mounted element, providing access to its rendered node.
 *
 * Use the standalone {@link refresh} function to re-render a Slot's children.
 *
 * @typeParam TNode - The type of the rendered node. Defaults to `unknown`
 *   because the base package is render-target agnostic.
 */
export interface Slot<TNode = unknown> {
  /** The underlying rendered node. */
  readonly node: TNode;
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

/** Tracks a keyed element's node and its associated unmount callbacks for reuse. */
export interface KeyedNode {
  key: string | number;
  node: unknown;
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
  }
>;

/** A DSL instruction that creates an SVG element with children and optional decorations. */
export type SvgElement = Tagged<
  "svg",
  {
    tag: string;
    children: Render;
    decorations?: Array<Attribute | Listener>;
    key?: string | number;
  }
>;

// =============================================================================
// Element Props Types
// =============================================================================

/** A single class item for {@link cn}. Falsy values are filtered out. */
export type ClassItem = string | false | null | undefined | 0 | "";

/** Style attribute value. A string or a CSSStyleDeclaration-like object with CSS custom properties. */
export type StyleValue = string | (Partial<CSSStyleDeclaration> & Record<`--${string}`, string>);

/** Event handler Props generated from HTMLElementEventMap. */
export type EventHandlerProps = {
  [K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?: (e: HTMLElementEventMap[K]) => void;
};

/** Props for element factories. Combines global HTML attributes, event handlers, and arbitrary attributes. */
export type ElementProps = EventHandlerProps & {
  class?: string;
  id?: string;
  style?: StyleValue;
  title?: string;
  lang?: string;
  dir?: "ltr" | "rtl" | "auto";
  tabindex?: number;
  hidden?: boolean;
  draggable?: boolean;
  contenteditable?: "" | "true" | "false" | "plaintext-only";
  role?: string;
  key?: string | number;
  [key: string]: unknown;
};

// =============================================================================
// Element Factory Types
// =============================================================================

/** HTML element factory with Props overloads. */
export interface HTMLElementFactory {
  (builder: Builder): Spell<"element">;
  (): Spell<"element">;
  (text: string): Spell<"element">;
  (props: ElementProps): Spell<"element">;
  (props: ElementProps, text: string): Spell<"element">;
  (props: ElementProps, builder: Builder): Spell<"element">;
}

/** SVG element factory with Props overloads. */
export interface SVGElementFactory {
  (builder: Builder): Spell<"svg">;
  (): Spell<"svg">;
  (text: string): Spell<"svg">;
  (props: ElementProps): Spell<"svg">;
  (props: ElementProps, text: string): Spell<"svg">;
  (props: ElementProps, builder: Builder): Spell<"svg">;
}
