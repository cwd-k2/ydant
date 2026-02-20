/**
 * @ydant/base - Primitives
 */

import type { Spell, Render, SpellSchema } from "@ydant/core";
import type { Slot, ClassItem, HTMLElementFactory, SVGElementFactory } from "./types";

/** Creates a text node and appends it to the current parent. Use with `yield*`. */
export function* text(content: string): Spell<"text"> {
  yield { type: "text", content };
}

/**
 * Registers a callback that runs after the component is mounted to the DOM.
 *
 * The callback may return a cleanup function, which will be called on unmount.
 *
 * @example
 * ```typescript
 * yield* onMount(() => {
 *   const interval = setInterval(() => console.log("tick"), 1000);
 *   return () => clearInterval(interval); // cleanup
 * });
 * ```
 */
export function* onMount(callback: () => void | (() => void)): Spell<"lifecycle"> {
  yield { type: "lifecycle", event: "mount", callback };
}

/**
 * Registers a callback that runs when the component is unmounted from the DOM.
 *
 * @example
 * ```typescript
 * yield* onUnmount(() => {
 *   console.log("Component unmounted");
 * });
 * ```
 */
export function* onUnmount(callback: () => void): Spell<"lifecycle"> {
  yield { type: "lifecycle", event: "unmount", callback };
}

/** Joins class names, filtering out falsy values. */
export function cn(...items: ClassItem[]): string {
  return items.filter(Boolean).join(" ");
}

/**
 * Wraps an element factory or component to attach a stable key for node reuse.
 *
 * When the same key appears across re-renders, the existing node is reused
 * instead of being recreated, preserving state and improving performance.
 *
 * @param key - A unique identifier (string or number) within the parent scope.
 * @param factory - An element factory (`div`, `li`, etc.) or a component.
 * @returns A keyed factory that accepts the same arguments as the original.
 *
 * @example
 * ```typescript
 * yield* keyed(item.id, li)(() => [text(item.name)]);
 * yield* keyed(item.id, ListItemView)({ item, onDelete });
 * ```
 */
export function keyed(key: string | number, factory: HTMLElementFactory): HTMLElementFactory;
export function keyed(key: string | number, factory: SVGElementFactory): SVGElementFactory;
export function keyed<K extends keyof SpellSchema, Args extends unknown[]>(
  key: string | number,
  factory: (...args: Args) => Spell<K>,
): (...args: Args) => Spell<K>;
export function keyed<Args extends unknown[]>(
  key: string | number,
  factory: (...args: Args) => Render,
): (...args: Args) => Spell<"element">;
export function keyed<Args extends unknown[]>(
  key: string | number,
  factory: (...args: Args) => Render,
): (...args: Args) => Render {
  return (...args: Args) => {
    return (function* (): Spell<"element"> {
      const inner = factory(...args) as Spell<"element">;
      const first = inner.next();
      if (first.done) return first.value;
      const element = first.value;
      const slot = (yield { ...element, key }) as Slot;
      inner.next(slot);
      return slot;
    })() as Spell<"element">;
  };
}
