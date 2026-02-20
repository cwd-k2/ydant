/**
 * @ydant/devtools - Plugin
 *
 * Instruments Engine lifecycle via monkey-patching and flush hooks.
 * The Engine itself contains no event-firing code — all observation
 * is opt-in through this plugin.
 */

import type { Plugin, RenderContext, Engine, Hub } from "@ydant/core";
import type { ExecutionScope, EngineOptions } from "@ydant/core/internals";
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
      emit({ type: "task:enqueued", engineId: engine.id, timestamp: Date.now() });
      originalEnqueue(task);
    };

    // Wrap stop
    const originalStop = engine.stop.bind(engine);
    engine.stop = () => {
      emit({ type: "engine:stopped", engineId: engine.id, timestamp: Date.now() });
      originalStop();
    };

    // Wrap pause
    const originalPause = engine.pause.bind(engine);
    engine.pause = () => {
      emit({ type: "engine:paused", engineId: engine.id, timestamp: Date.now() });
      originalPause();
    };

    // Wrap resume
    const originalResume = engine.resume.bind(engine);
    engine.resume = () => {
      emit({ type: "engine:resumed", engineId: engine.id, timestamp: Date.now() });
      originalResume();
    };

    // Register flush hooks
    engine.onBeforeFlush(() => {
      emit({ type: "flush:start", engineId: engine.id, timestamp: Date.now() });
    });
    engine.onFlush(() => {
      emit({ type: "flush:end", engineId: engine.id, timestamp: Date.now() });
    });

    // Register error observation
    engine.on("engine:error", (message) => {
      emit({
        type: "engine:error",
        engineId: engine.id,
        timestamp: Date.now(),
        error: message.error,
        sourceEngineId: message.sourceEngineId,
      });
    });

    cleanups.push(() => {
      engine.enqueue = originalEnqueue;
      engine.stop = originalStop;
      engine.pause = originalPause;
      engine.resume = originalResume;
    });

    emit({ type: "engine:spawned", engineId: engine.id, timestamp: Date.now() });
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
