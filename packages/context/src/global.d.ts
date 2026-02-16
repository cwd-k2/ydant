/**
 * @ydant/context - Module augmentation
 *
 * Extends core interfaces with context-related properties and spell types.
 */

import type { ContextProvide, ContextInject } from "./context";

declare module "@ydant/core" {
  interface RenderContext {
    /** Map of context values keyed by their symbol identifiers. Inherited from parent contexts. */
    contextValues: Map<symbol, unknown>;
  }

  // The "context-inject" response type is `unknown` because the actual type
  // is determined by the Context<T> generic at the call site.
  interface SpellSchema {
    "context-provide": { request: ContextProvide; capabilities: never };
    "context-inject": { request: ContextInject; response: unknown; capabilities: never };
  }
}
