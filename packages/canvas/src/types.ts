/**
 * @ydant/canvas - DSL type definitions
 */

import type { Tagged, Render } from "@ydant/core";
import type { Attribute, Listener } from "@ydant/base";

/** A DSL instruction that creates a canvas shape with children and optional decorations. */
export type Shape = Tagged<
  "shape",
  {
    tag: string;
    children: Render;
    decorations?: Array<Attribute | Listener>;
    key?: string | number;
  }
>;
