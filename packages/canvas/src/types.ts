/**
 * @ydant/canvas - DSL type definitions
 */

import type { Tagged, Render } from "@ydant/core";

/** A DSL instruction that creates a canvas shape with children. */
export type Shape = Tagged<
  "shape",
  {
    tag: string;
    children: Render;
    key?: string | number;
  }
>;
