/**
 * @ydant/canvas - Shape element factories
 *
 * Each factory creates an Element request with a canvas-specific tag.
 * These are processed by createBasePlugin() just like DOM elements,
 * but the canvas capability provider creates VShapes instead of DOM nodes.
 */

import type { Builder, Spell } from "@ydant/core";
import { toRender } from "@ydant/core";
import type { Element, Slot } from "@ydant/base";

function createShapeElement(tag: string): (builder: Builder) => Spell<"element"> {
  return function* (builder: Builder): Spell<"element"> {
    const children = toRender(builder());
    return (yield { type: "element", tag, children } as Element) as Slot;
  };
}

/** A group container — positions children relative to itself. */
export const group = createShapeElement("group");

/** A rectangle shape. Props: x, y, width, height, rx, fill, stroke, lineWidth, opacity. */
export const rect = createShapeElement("rect");

/** A circle shape. Props: cx, cy, r, fill, stroke, lineWidth, opacity. */
export const circle = createShapeElement("circle");

/** An ellipse shape. Props: cx, cy, rx, ry, fill, stroke, lineWidth, opacity. */
export const ellipse = createShapeElement("ellipse");

/** A line shape. Props: x1, y1, x2, y2, stroke, lineWidth, opacity. */
export const line = createShapeElement("line");

/** A path shape. Props: d, fill, stroke, lineWidth, opacity. */
export const canvasPath = createShapeElement("path");

/** A text shape. Props: x, y, content, font, fill, stroke, textAlign, textBaseline, opacity. */
export const canvasText = createShapeElement("text");
