/**
 * @ydant/devtools - Plugin
 *
 * Instruments Engine lifecycle via monkey-patching and flush hooks.
 * The Engine itself contains no event-firing code — all observation
 * is opt-in through this plugin.
 */

import type {
  Plugin,
  RenderContext,
  Engine,
  Hub,
  ExecutionScope,
  EngineOptions,
} from "@ydant/core";
import { TASK_ENQUEUED, FLUSH_START, FLUSH_END, ENGINE_SPAWNED, ENGINE_STOPPED } from "./events";
import type { DevtoolsEvent } from "./events";

/** Options for {@link createDevtoolsPlugin}. */
export interface DevtoolsPluginOptions {
  /** Called for every event. Use this for logging or streaming. */
  onEvent?: (event: DevtoolsEvent) => void;
  /** Maximum number of events to retain in the ring buffer. Defaults to 1000. */
  bufferSize?: number;
}

/** A DevTools plugin with access to the event buffer. */
export interface DevtoolsPlugin extends Plugin {
  /** Returns the buffered events (most recent last). */
  getEvents(): readonly DevtoolsEvent[];
  /** Clears the event buffer. */
  clearEvents(): void;
}

/** Creates an opt-in DevTools plugin that observes Engine lifecycle. */
export function createDevtoolsPlugin(options?: DevtoolsPluginOptions): DevtoolsPlugin {
  const bufferSize = options?.bufferSize ?? 1000;
  const onEvent = options?.onEvent;
  const events: DevtoolsEvent[] = [];
  const cleanups: Array<() => void> = [];
  let active = false;

  function emit(event: DevtoolsEvent): void {
    if (!active) return;
    events.push(event);
    if (events.length > bufferSize) {
      events.shift();
    }
    onEvent?.(event);
  }

  function instrumentEngine(engine: Engine): void {
    // Wrap enqueue
    const originalEnqueue = engine.enqueue.bind(engine);
    engine.enqueue = (task: () => void) => {
      emit({ type: TASK_ENQUEUED, engineId: engine.id, timestamp: Date.now() });
      originalEnqueue(task);
    };

    // Wrap stop
    const originalStop = engine.stop.bind(engine);
    engine.stop = () => {
      emit({ type: ENGINE_STOPPED, engineId: engine.id, timestamp: Date.now() });
      originalStop();
    };

    // Register flush hooks
    engine.onBeforeFlush(() => {
      emit({ type: FLUSH_START, engineId: engine.id, timestamp: Date.now() });
    });
    engine.onFlush(() => {
      emit({ type: FLUSH_END, engineId: engine.id, timestamp: Date.now() });
    });

    cleanups.push(() => {
      engine.enqueue = originalEnqueue;
      engine.stop = originalStop;
    });

    emit({ type: ENGINE_SPAWNED, engineId: engine.id, timestamp: Date.now() });
  }

  return {
    name: "devtools",
    types: [],

    setup(ctx: RenderContext) {
      active = true;
      const hub: Hub = ctx.engine.hub;

      // Instrument all existing engines
      for (const engine of hub.engines()) {
        instrumentEngine(engine);
      }

      // Wrap hub.spawn to auto-instrument future engines
      const originalSpawn = hub.spawn.bind(hub);
      hub.spawn = (id: string, scope: ExecutionScope, opts?: EngineOptions) => {
        const engine = originalSpawn(id, scope, opts);
        instrumentEngine(engine);
        return engine;
      };

      cleanups.push(() => {
        hub.spawn = originalSpawn;
      });
    },

    teardown() {
      active = false;
      for (const cleanup of cleanups) {
        cleanup();
      }
      cleanups.length = 0;
    },

    getEvents() {
      return events;
    },

    clearEvents() {
      events.length = 0;
    },
  };
}
