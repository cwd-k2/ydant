/**
 * @ydant/core - Capability interfaces
 *
 * Capabilities are the primitive operations a rendering backend provides.
 * Each capability is injected into {@link RenderContext} via plugin's
 * `initContext`, following the same module augmentation pattern used
 * by existing plugins.
 *
 * Concrete implementations live in target packages (@ydant/base for DOM,
 * @ydant/canvas for Canvas2D, @ydant/ssr for SSR).
 */

// =============================================================================
// Capability interfaces
// =============================================================================

/** Builds a node tree — creates nodes and assembles parent-child relationships. */
export interface TreeCapability {
  createElement(tag: string): unknown;
  createElementNS(ns: string, tag: string): unknown;
  createTextNode(content: string): unknown;
  createMarker(): unknown;
  appendChild(parent: unknown, child: unknown): void;
  insertBefore(parent: unknown, child: unknown, reference: unknown): void;
  removeChild(parent: unknown, child: unknown): void;
  nextSibling(parent: unknown, node: unknown): unknown | null;
  clearChildren(parent: unknown): void;
}

/** Decorates nodes with attributes. */
export interface DecorateCapability {
  setAttribute(node: unknown, key: string, value: string): void;
}

/** Responds to external input by attaching event handlers. */
export interface InteractCapability {
  addEventListener(node: unknown, type: string, handler: (e: unknown) => void): void;
}

/** Schedules deferred callbacks (e.g., mount hooks). */
export interface ScheduleCapability {
  scheduleCallback(callback: () => void): void;
}

/** Resolves existing nodes during hydration (cursor-based tree walker). */
export interface ResolveCapability {
  nextChild(parent: unknown): unknown | null;
}
