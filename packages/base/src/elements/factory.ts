/**
 * @ydant/base - Element factories
 */

import type { Builder, DSL } from "@ydant/core";
import { toRender } from "@ydant/core";
import type { Element, Slot } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Creates an HTML element factory for the given tag name.
 *
 * The returned function takes a {@link Builder} and returns a `DSL<"element">`
 * generator. Using `yield*` on it produces a {@link Slot} handle.
 */
export function createHTMLElement(tag: string): (builder: Builder) => DSL<"element"> {
  // TypeScript cannot infer that `yield` returns Slot here because Generator's
  // TNext is structurally fixed at declaration. The `as Slot` cast is safe —
  // the base plugin always passes a Slot back when processing an Element.
  return function* (builder: Builder): DSL<"element"> {
    const children = toRender(builder());
    return (yield { type: "element", tag, children } as Element) as Slot;
  };
}

/**
 * Creates an SVG element factory for the given tag name.
 *
 * Same as {@link createHTMLElement} but uses the SVG namespace.
 */
export function createSVGElement(tag: string): (builder: Builder) => DSL<"element"> {
  return function* (builder: Builder): DSL<"element"> {
    const children = toRender(builder());
    return (yield {
      type: "element",
      tag,
      children,
      ns: SVG_NS,
    } as Element) as Slot;
  };
}
