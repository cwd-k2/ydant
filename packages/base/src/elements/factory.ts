/**
 * @ydant/base - Element factories
 */

import type { Builder, Spell } from "@ydant/core";
import { toRender } from "@ydant/core";
import type { Element, SvgElement, Slot } from "../types";

/**
 * Creates an HTML element factory for the given tag name.
 *
 * The returned function takes a {@link Builder} and returns a `Spell<"element">`
 * generator. Using `yield*` on it produces a {@link Slot} handle.
 */
export function createHTMLElement(tag: string): (builder: Builder) => Spell<"element"> {
  // TypeScript cannot infer that `yield` returns Slot here because Generator's
  // TNext is structurally fixed at declaration. The `as Slot` cast is safe —
  // the base plugin always passes a Slot back when processing an Element.
  return function* (builder: Builder): Spell<"element"> {
    const children = toRender(builder());
    return (yield { type: "element", tag, children } as Element) as Slot;
  };
}

/**
 * Creates an SVG element factory for the given tag name.
 *
 * Same as {@link createHTMLElement} but yields a `"svg"` spell type
 * processed via `createElementNS` with the SVG namespace.
 */
export function createSVGElement(tag: string): (builder: Builder) => Spell<"svg"> {
  return function* (builder: Builder): Spell<"svg"> {
    const children = toRender(builder());
    return (yield { type: "svg", tag, children } as SvgElement) as Slot;
  };
}
