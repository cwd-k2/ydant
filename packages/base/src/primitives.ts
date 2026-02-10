/**
 * @ydant/base - Primitives
 */

import type { Spell, Render } from "@ydant/core";
import type { Slot } from "./types";

/** Sets an HTML attribute on the current element. Use with `yield*`. */
export function* attr(key: string, value: string): Spell<"attribute"> {
  yield { type: "attribute", key, value };
}

/** Sets the `class` attribute by joining all arguments. */
export function* classes(...classNames: string[]): Spell<"attribute"> {
  const value = classNames.join(" ");
  yield { type: "attribute", key: "class", value };
}

/** Attaches a DOM event listener. Infers the event type from {@link HTMLElementEventMap}. */
export function on<K extends keyof HTMLElementEventMap>(
  key: K,
  handler: (e: HTMLElementEventMap[K]) => void,
): Spell<"listener">;
/** Attaches a DOM event listener for custom event names. */
export function on(key: string, handler: (e: Event) => void): Spell<"listener">;
export function on(key: string, handler: (e: Event) => void): Spell<"listener"> {
  return (function* () {
    yield { type: "listener" as const, key, value: handler };
  })();
}

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

/**
 * Sets inline styles on the current element.
 *
 * Accepts camelCase properties (auto-converted to kebab-case) and CSS custom properties.
 *
 * @example
 * ```typescript
 * yield* style({
 *   padding: "16px",
 *   display: "flex",
 *   "--primary-color": "#3b82f6",
 * });
 * ```
 */
export function* style(
  properties: Partial<CSSStyleDeclaration> & Record<`--${string}`, string>,
): Spell<"attribute"> {
  const styleValue = Object.entries(properties as Record<string, string>)
    .map(([k, v]) => {
      // Convert camelCase to kebab-case (skip CSS custom properties)
      const prop = k.startsWith("--") ? k : k.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${prop}: ${v}`;
    })
    .join("; ");
  yield { type: "attribute", key: "style", value: styleValue };
}

/**
 * Wraps an element factory or component to attach a stable key for DOM reuse.
 *
 * When the same key appears across re-renders, the existing DOM node is reused
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
export function keyed<Args extends unknown[]>(
  key: string | number,
  factory: (...args: Args) => Render,
): (...args: Args) => Spell<"element"> {
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
