/**
 * @ydant/base - Element factories
 */

import type { Spell } from "@ydant/core";
import type { Element, SvgElement, Slot, HTMLElementFactory, SVGElementFactory } from "../types";
import { parseFactoryArgs } from "./props";

/**
 * Creates an HTML element factory for the given tag name.
 *
 * Supports multiple call signatures:
 * - `div(builder)` — existing Builder API
 * - `div()` — empty element
 * - `div("text")` — text shorthand
 * - `div({ class: "..." })` — Props only
 * - `div({ class: "..." }, "text")` — Props + text
 * - `div({ class: "..." }, builder)` — Props + Builder
 */
export function createHTMLElement(tag: string): HTMLElementFactory {
  // The inner generator has a single variadic signature, while HTMLElementFactory
  // is an interface with multiple overloads (props, builder, text shorthand, etc.).
  // TypeScript cannot directly assign a generator to an overloaded interface,
  // so `as unknown as` bridges this intentional gap.
  return function* (...args: unknown[]): Spell<"element"> {
    const { children, decorations, key } = parseFactoryArgs(args);
    return (yield { type: "element", tag, children, decorations, key } as Element) as Slot;
  } as unknown as HTMLElementFactory;
}

/**
 * Creates an SVG element factory for the given tag name.
 *
 * Same overload patterns as {@link createHTMLElement} but yields a `"svg"` spell type
 * processed via `createElementNS` with the SVG namespace.
 */
export function createSVGElement(tag: string): SVGElementFactory {
  // Same `as unknown as` bridge as createHTMLElement — see comment above.
  return function* (...args: unknown[]): Spell<"svg"> {
    const { children, decorations, key } = parseFactoryArgs(args);
    return (yield { type: "svg", tag, children, decorations, key } as SvgElement) as Slot;
  } as unknown as SVGElementFactory;
}
