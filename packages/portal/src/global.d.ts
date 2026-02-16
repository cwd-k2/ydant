/**
 * @ydant/portal - Module augmentation
 *
 * Registers the "portal" spell type in the SpellSchema.
 */

import type { Portal } from "./types";

declare module "@ydant/core" {
  interface SpellSchema {
    portal: { request: Portal; capabilities: "tree" };
  }
}
