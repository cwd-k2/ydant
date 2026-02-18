/**
 * @ydant/core - Module augmentation
 *
 * Declares capability fields on RenderContext.
 * These are injected by target-specific capability providers
 * (DOM, Canvas, SSR) via plugin initContext.
 */

import type {
  TreeCapability,
  DecorateCapability,
  InteractCapability,
  ScheduleCapability,
  ResolveCapability,
} from "./capabilities";
import type { Embed } from "./embed";
import type { Engine } from "./plugin";

declare module "@ydant/core" {
  interface SpellSchema {
    embed: { request: Embed; response: Engine; capabilities: never };
  }

  interface RenderContext {
    /** Tree operations: create nodes and assemble parent-child relationships. */
    tree: TreeCapability;
    /** Decoration operations: set attributes on nodes. */
    decorate: DecorateCapability;
    /** Interaction operations: attach event listeners to nodes. Optional — not all backends support events. */
    interact?: InteractCapability;
    /** Scheduling operations: defer callbacks (e.g., mount hooks). */
    schedule: ScheduleCapability;
    /** The element currently being decorated, or `null` between elements. */
    currentElement: unknown;
    /** Node resolver for hydration. Only injected when hydrating. */
    resolve?: ResolveCapability;
    /** Error handler for async render errors (e.g., reactive updates). Returns true if handled. */
    handleRenderError?: (error: unknown) => boolean;
  }
}
