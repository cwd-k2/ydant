/**
 * @ydant/devtools - Developer tools for Ydant
 *
 * Opt-in Engine lifecycle observation. Instruments enqueue, flush,
 * spawn, and stop without modifying the Engine itself.
 * Zero overhead when not registered.
 *
 * @example
 * ```typescript
 * import { createDevtoolsPlugin } from "@ydant/devtools";
 *
 * const devtools = createDevtoolsPlugin({
 *   onEvent: (e) => console.log(e.type, e.engineId),
 * });
 *
 * mount(App, {
 *   backend: createDOMBackend(root),
 *   plugins: [createBasePlugin(), devtools],
 * });
 *
 * // Read buffered events
 * console.log(devtools.getEvents());
 * ```
 */

// ─── Types ───
export type { DevtoolsEvent } from "./events";
export type { DevtoolsPluginOptions, DevtoolsPlugin } from "./plugin";

// ─── Constants ───
export { TASK_ENQUEUED, FLUSH_START, FLUSH_END, ENGINE_SPAWNED, ENGINE_STOPPED } from "./events";

// ─── Plugin ───
export { createDevtoolsPlugin } from "./plugin";

// ─── Overlay ───
export type { DevtoolsOverlay } from "./overlay";
export { createDevtoolsOverlay } from "./overlay";
