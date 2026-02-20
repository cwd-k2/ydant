/**
 * @ydant/canvas - Module augmentation
 *
 * Registers the "shape" spell type for canvas rendering.
 */

import type { Shape } from "./types";
import type { Slot } from "@ydant/base";

declare module "@ydant/core" {
  interface SpellSchema {
    shape: { request: Shape; response: Slot; capabilities: "tree" | "decorate" };
  }
}
