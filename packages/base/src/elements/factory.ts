/**
 * @ydant/base - Element factories
 */

import type { Builder } from "@ydant/core";
import { toChildren } from "@ydant/core";
import type { Element, ElementRender, Slot } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Creates an HTML element factory for the given tag name.
 *
 * The returned function takes a {@link Builder} and returns an {@link ElementRender}
 * generator. Using `yield*` on it produces a {@link Slot} handle.
 */
export function createHTMLElement(tag: string): (builder: Builder) => ElementRender {
  // The generator's ChildNext includes void | Slot | ..., but yielding an Element
  // is contractually guaranteed to receive a Slot back from the plugin system.
  // We cast internally and expose the correct ElementRender type externally.
  return function* (builder: Builder): ElementRender {
    const children = toChildren(builder());
    return (yield { type: "element", tag, children } as Element) as Slot;
  };
}

/**
 * Creates an SVG element factory for the given tag name.
 *
 * Same as {@link createHTMLElement} but uses the SVG namespace.
 */
export function createSVGElement(tag: string): (builder: Builder) => ElementRender {
  return function* (builder: Builder): ElementRender {
    const children = toChildren(builder());
    return (yield {
      type: "element",
      tag,
      children,
      ns: SVG_NS,
    } as Element) as Slot;
  };
}
