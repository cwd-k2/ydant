/**
 * @ydant/async - Module augmentation
 *
 * Extends core interfaces with async-related spell types.
 */

import type { Boundary } from "./boundary";
import type { ChunkedRequest } from "./chunked";

declare module "@ydant/core" {
  interface SpellSchema {
    boundary: { request: Boundary; capabilities: never };
    chunked: { request: ChunkedRequest; capabilities: never };
  }
}
