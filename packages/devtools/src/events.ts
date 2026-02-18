/**
 * @ydant/devtools - Event types
 *
 * Standard event types for Engine lifecycle observation.
 */

/** All recognized DevTools event type strings. */
export type DevtoolsEventType =
  | "task:enqueued"
  | "flush:start"
  | "flush:end"
  | "engine:spawned"
  | "engine:stopped"
  | "engine:paused"
  | "engine:resumed"
  | "engine:error";

/** A DevTools event recording Engine lifecycle activity. */
export interface DevtoolsEvent {
  readonly type: DevtoolsEventType;
  readonly engineId: string;
  readonly timestamp: number;
  readonly [key: string]: unknown;
}
