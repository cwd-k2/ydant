/**
 * @ydant/core - Hub and Engine
 *
 * Hub orchestrates independent Engine instances. Each Engine owns
 * a task queue (Set for dedup) and a Scheduler that decides when to flush.
 */

import type { ExecutionScope, Engine, EngineOptions, Hub, Message, Scheduler } from "./plugin";
import { sync } from "./scheduler";

// =============================================================================
// Engine (internal)
// =============================================================================

function createEngine(id: string, scope: ExecutionScope, hub: Hub, scheduler: Scheduler): Engine {
  const queue = new Set<() => void>();
  const handlers = new Map<string, Array<(message: Message) => void>>();
  const beforeFlushCallbacks: Array<() => void> = [];
  const flushCallbacks: Array<() => void> = [];
  let stopped = false;
  let scheduled = false;

  function flush(): void {
    if (stopped) return;
    scheduled = false;

    // Notify before-flush observers
    for (const cb of beforeFlushCallbacks) {
      cb();
    }

    // Snapshot and clear — tasks enqueued during flush will schedule a new round
    const tasks = [...queue];
    queue.clear();

    for (const task of tasks) {
      task();
    }

    // Notify flush observers after all tasks in this cycle have completed
    for (const cb of flushCallbacks) {
      cb();
    }
  }

  function scheduleFlush(): void {
    if (scheduled || stopped) return;
    scheduled = true;
    scheduler(flush);
  }

  const engine: Engine = {
    id,
    scope,
    hub,

    enqueue(task: () => void): void {
      if (stopped) return;
      queue.add(task);
      scheduleFlush();
    },

    onBeforeFlush(callback: () => void): void {
      beforeFlushCallbacks.push(callback);
    },

    onFlush(callback: () => void): void {
      flushCallbacks.push(callback);
    },

    on(type: string, handler: (message: Message) => void): void {
      let list = handlers.get(type);
      if (!list) {
        list = [];
        handlers.set(type, list);
      }
      list.push(handler);
    },

    stop(): void {
      stopped = true;
      queue.clear();
      beforeFlushCallbacks.length = 0;
      flushCallbacks.length = 0;
    },
  };

  // Attach deliver as an internal method accessible to Hub
  (engine as EngineInternal).__deliver = (message: Message): void => {
    const list = handlers.get(message.type);
    if (list) {
      for (const handler of list) {
        handler(message);
      }
    }
  };

  return engine;
}

/** Internal engine interface with deliver method (not exposed to users). */
interface EngineInternal extends Engine {
  __deliver(message: Message): void;
}

// =============================================================================
// Hub
// =============================================================================

/** Creates a new Hub that orchestrates Engine instances. */
export function createHub(): Hub {
  const engines = new Map<string, Engine>();
  const scopeToEngine = new Map<ExecutionScope, Engine>();

  const hub: Hub = {
    spawn(id: string, scope: ExecutionScope, options?: EngineOptions): Engine {
      if (engines.has(id)) {
        throw new Error(`[ydant] Engine "${id}" already exists.`);
      }

      const scheduler = options?.scheduler ?? scope.backend.defaultScheduler ?? sync;
      const engine = createEngine(id, scope, hub, scheduler);

      engines.set(id, engine);
      scopeToEngine.set(scope, engine);

      return engine;
    },

    get(id: string): Engine | undefined {
      return engines.get(id);
    },

    resolve(scope: ExecutionScope): Engine | undefined {
      return scopeToEngine.get(scope);
    },

    engines(): Iterable<Engine> {
      return engines.values();
    },

    dispatch(target: Engine | ExecutionScope, message: Message): void {
      const engine =
        "id" in target ? (target as Engine) : scopeToEngine.get(target as ExecutionScope);
      if (engine) {
        (engine as EngineInternal).__deliver(message);
      }
    },

    dispose(): void {
      for (const engine of engines.values()) {
        engine.stop();
      }
      engines.clear();
      scopeToEngine.clear();
    },
  };

  return hub;
}
