import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHub } from "@ydant/core";
import { sync, microtask } from "@ydant/core";
import type { Backend, ExecutionScope, Hub, RenderContext } from "@ydant/core";
import {
  createDevtoolsPlugin,
  TASK_ENQUEUED,
  FLUSH_START,
  FLUSH_END,
  ENGINE_SPAWNED,
  ENGINE_STOPPED,
} from "../index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockBackend(name = "mock"): Backend {
  return { name, root: {}, initContext() {} };
}

function createMockScope(name = "mock"): ExecutionScope {
  return {
    backend: createMockBackend(name),
    pluginMap: new Map(),
    allPlugins: [],
  };
}

function setupDevtools(hub: Hub, scope: ExecutionScope) {
  const engine = hub.spawn("primary", scope, { scheduler: sync });
  const ctx = { engine } as RenderContext;
  const devtools = createDevtoolsPlugin();
  devtools.setup!(ctx);
  return { engine, devtools };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DevTools plugin", () => {
  let hub: Hub;
  let scope: ExecutionScope;

  beforeEach(() => {
    hub = createHub();
    scope = createMockScope();
  });

  it("emits ENGINE_SPAWNED for existing engines on setup", () => {
    const { devtools } = setupDevtools(hub, scope);

    const events = devtools.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(ENGINE_SPAWNED);
    expect(events[0].engineId).toBe("primary");
  });

  it("emits TASK_ENQUEUED when a task is enqueued", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.enqueue(() => {});

    const enqueued = devtools.getEvents().filter((e) => e.type === TASK_ENQUEUED);
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].engineId).toBe("primary");
  });

  it("emits FLUSH_START and FLUSH_END around flush cycle", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.enqueue(() => {});

    const types = devtools
      .getEvents()
      .filter((e) => e.type === FLUSH_START || e.type === FLUSH_END)
      .map((e) => e.type);
    expect(types).toEqual([FLUSH_START, FLUSH_END]);
  });

  it("emits correct order: TASK_ENQUEUED → FLUSH_START → FLUSH_END", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.enqueue(() => {});

    const types = devtools
      .getEvents()
      .filter((e) => e.type !== ENGINE_SPAWNED)
      .map((e) => e.type);
    expect(types).toEqual([TASK_ENQUEUED, FLUSH_START, FLUSH_END]);
  });

  it("emits ENGINE_STOPPED when engine is stopped", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.stop();

    const stopped = devtools.getEvents().filter((e) => e.type === ENGINE_STOPPED);
    expect(stopped).toHaveLength(1);
  });

  it("auto-instruments engines spawned after setup", () => {
    const { devtools } = setupDevtools(hub, scope);

    const scope2 = createMockScope("second");
    const engine2 = hub.spawn("secondary", scope2, { scheduler: sync });

    const spawned = devtools.getEvents().filter((e) => e.type === ENGINE_SPAWNED);
    expect(spawned).toHaveLength(2);
    expect(spawned[1].engineId).toBe("secondary");

    engine2.enqueue(() => {});
    const enqueued = devtools.getEvents().filter((e) => e.type === TASK_ENQUEUED);
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].engineId).toBe("secondary");
  });

  it("batched signal changes produce one FLUSH_START/FLUSH_END pair", async () => {
    const scope = createMockScope();
    const engine = hub.spawn("primary", scope, { scheduler: microtask });
    const ctx = { engine } as RenderContext;
    const devtools = createDevtoolsPlugin();
    devtools.setup!(ctx);

    // Multiple enqueues before flush
    const task = vi.fn();
    engine.enqueue(task);
    engine.enqueue(task);
    engine.enqueue(task);

    await new Promise<void>((r) => queueMicrotask(r));

    const flushStarts = devtools.getEvents().filter((e) => e.type === FLUSH_START);
    const flushEnds = devtools.getEvents().filter((e) => e.type === FLUSH_END);
    expect(flushStarts).toHaveLength(1);
    expect(flushEnds).toHaveLength(1);
    // Task was deduplicated
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("calls onEvent callback for every event", () => {
    const onEvent = vi.fn();
    const engine = hub.spawn("primary", scope, { scheduler: sync });
    const ctx = { engine } as RenderContext;
    const devtools = createDevtoolsPlugin({ onEvent });
    devtools.setup!(ctx);

    engine.enqueue(() => {});

    // ENGINE_SPAWNED + TASK_ENQUEUED + FLUSH_START + FLUSH_END
    expect(onEvent).toHaveBeenCalledTimes(4);
  });

  it("respects bufferSize limit", () => {
    const engine = hub.spawn("primary", scope, { scheduler: sync });
    const ctx = { engine } as RenderContext;
    const devtools = createDevtoolsPlugin({ bufferSize: 5 });
    devtools.setup!(ctx);

    // ENGINE_SPAWNED is event 1, then each enqueue generates 3 events
    for (let i = 0; i < 5; i++) {
      engine.enqueue(() => {});
    }

    expect(devtools.getEvents().length).toBeLessThanOrEqual(5);
  });

  it("clearEvents empties the buffer", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.enqueue(() => {});
    expect(devtools.getEvents().length).toBeGreaterThan(0);

    devtools.clearEvents();
    expect(devtools.getEvents()).toHaveLength(0);
  });

  it("teardown stops event emission", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    devtools.clearEvents();
    devtools.teardown!({} as RenderContext);

    engine.enqueue(() => {});

    expect(devtools.getEvents()).toHaveLength(0);
  });

  it("events have timestamp", () => {
    const { devtools } = setupDevtools(hub, scope);

    const events = devtools.getEvents();
    for (const event of events) {
      expect(typeof event.timestamp).toBe("number");
      expect(event.timestamp).toBeGreaterThan(0);
    }
  });
});
