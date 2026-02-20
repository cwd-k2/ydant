/**
 * @ydant/canvas - Shape element factories
 *
 * Each factory creates a Shape request with a canvas-specific tag.
 * These are processed by createCanvasPlugin() which uses the shared
 * processNode utility to create VShapes via the canvas backend.
 */

import type { Builder, Spell } from "@ydant/core";
import type { Slot, ElementProps } from "@ydant/base";
import { parseFactoryArgs } from "@ydant/base/internals";
import type { Shape } from "./types";

/** Canvas shape factory with Props overloads. */
export interface ShapeFactory {
  (builder: Builder): Spell<"shape">;
  (): Spell<"shape">;
  (props: ElementProps): Spell<"shape">;
  (props: ElementProps, builder: Builder): Spell<"shape">;
}

function createShapeElement(tag: string): ShapeFactory {
  return function* (...args: unknown[]): Spell<"shape"> {
    const { children, decorations, key } = parseFactoryArgs(args);
    return (yield { type: "shape", tag, children, decorations, key } as Shape) as Slot;
  } as ShapeFactory;
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
