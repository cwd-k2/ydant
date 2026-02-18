/**
 * @ydant/async - Module augmentation
 *
 * Extends core interfaces with async-related spell types.
 */

import type { Boundary } from "./boundary";

declare module "@ydant/core" {
  interface SpellSchema {
    boundary: { request: Boundary; capabilities: never };
  }
}
