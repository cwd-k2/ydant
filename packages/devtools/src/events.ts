/**
 * @ydant/devtools - Event types
 *
 * Standard event type constants for Engine lifecycle observation.
 */

/** Emitted when a task is added to an Engine's queue. */
export const TASK_ENQUEUED = "task:enqueued";

/** Emitted when an Engine's flush cycle begins. */
export const FLUSH_START = "flush:start";

/** Emitted when an Engine's flush cycle completes. */
export const FLUSH_END = "flush:end";

/** Emitted when a new Engine is spawned. */
export const ENGINE_SPAWNED = "engine:spawned";

/** Emitted when an Engine is stopped. */
export const ENGINE_STOPPED = "engine:stopped";

/** A DevTools event recording Engine lifecycle activity. */
export interface DevtoolsEvent {
  readonly type: string;
  readonly engineId: string;
  readonly timestamp: number;
  readonly [key: string]: unknown;
}
