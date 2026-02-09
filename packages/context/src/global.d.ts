/**
 * @ydant/context - Module augmentation
 *
 * Extends core interfaces with context-related properties and DSL types.
 */

import type { ContextProvide, ContextInject } from "./context";

declare module "@ydant/core" {
  interface RenderContext {
    /** Map of context values keyed by their symbol identifiers. Inherited from parent contexts. */
    contextValues: Map<symbol, unknown>;
  }

  interface RenderAPI {
    /** Retrieves a context value by its symbol identifier. */
    getContext<T>(id: symbol): T | undefined;
    /** Sets a context value by its symbol identifier. */
    setContext<T>(id: symbol, value: T): void;
  }

  // The "context-inject" feedback type is `unknown` because the actual type
  // is determined by the Context<T> generic at the call site.
  interface DSLSchema {
    "context-provide": { instruction: ContextProvide };
    "context-inject": { instruction: ContextInject; feedback: unknown };
  }
}
