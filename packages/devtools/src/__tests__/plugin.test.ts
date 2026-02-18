import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHub } from "@ydant/core";
import { sync, microtask } from "@ydant/core";
import type { Backend, ExecutionScope, Hub, RenderContext } from "@ydant/core";
import { createDevtoolsPlugin } from "../index";

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

  it("emits engine:spawned for existing engines on setup", () => {
    const { devtools } = setupDevtools(hub, scope);

    const events = devtools.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("engine:spawned");
    expect(events[0].engineId).toBe("primary");
  });

  it("emits task:enqueued when a task is enqueued", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.enqueue(() => {});

    const enqueued = devtools.getEvents().filter((e) => e.type === "task:enqueued");
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].engineId).toBe("primary");
  });

  it("emits flush:start and flush:end around flush cycle", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.enqueue(() => {});

    const types = devtools
      .getEvents()
      .filter((e) => e.type === "flush:start" || e.type === "flush:end")
      .map((e) => e.type);
    expect(types).toEqual(["flush:start", "flush:end"]);
  });

  it("emits correct order: task:enqueued → flush:start → flush:end", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.enqueue(() => {});

    const types = devtools
      .getEvents()
      .filter((e) => e.type !== "engine:spawned")
      .map((e) => e.type);
    expect(types).toEqual(["task:enqueued", "flush:start", "flush:end"]);
  });

  it("emits engine:stopped when engine is stopped", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.stop();

    const stopped = devtools.getEvents().filter((e) => e.type === "engine:stopped");
    expect(stopped).toHaveLength(1);
  });

  it("auto-instruments engines spawned after setup", () => {
    const { devtools } = setupDevtools(hub, scope);

    const scope2 = createMockScope("second");
    const engine2 = hub.spawn("secondary", scope2, { scheduler: sync });

    const spawned = devtools.getEvents().filter((e) => e.type === "engine:spawned");
    expect(spawned).toHaveLength(2);
    expect(spawned[1].engineId).toBe("secondary");

    engine2.enqueue(() => {});
    const enqueued = devtools.getEvents().filter((e) => e.type === "task:enqueued");
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].engineId).toBe("secondary");
  });

  it("batched signal changes produce one flush:start/flush:end pair", async () => {
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

    const flushStarts = devtools.getEvents().filter((e) => e.type === "flush:start");
    const flushEnds = devtools.getEvents().filter((e) => e.type === "flush:end");
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

    // engine:spawned + task:enqueued + flush:start + flush:end
    expect(onEvent).toHaveBeenCalledTimes(4);
  });

  it("respects bufferSize limit", () => {
    const engine = hub.spawn("primary", scope, { scheduler: sync });
    const ctx = { engine } as RenderContext;
    const devtools = createDevtoolsPlugin({ bufferSize: 5 });
    devtools.setup!(ctx);

    // engine:spawned is event 1, then each enqueue generates 3 events
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

  it("emits engine:paused when engine is paused", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.pause();

    const paused = devtools.getEvents().filter((e) => e.type === "engine:paused");
    expect(paused).toHaveLength(1);
    expect(paused[0].engineId).toBe("primary");
  });

  it("emits engine:resumed when engine is resumed", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    engine.pause();
    engine.resume();

    const resumed = devtools.getEvents().filter((e) => e.type === "engine:resumed");
    expect(resumed).toHaveLength(1);
    expect(resumed[0].engineId).toBe("primary");
  });

  it("emits engine:error when engine receives error message", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    const testError = new Error("test-error");
    hub.dispatch(engine, {
      type: "engine:error",
      error: testError,
      sourceEngineId: "child-engine",
    });

    const errors = devtools.getEvents().filter((e) => e.type === "engine:error");
    expect(errors).toHaveLength(1);
    expect(errors[0].engineId).toBe("primary");
    expect(errors[0].error).toBe(testError);
    expect(errors[0].sourceEngineId).toBe("child-engine");
  });

  it("teardown restores pause and resume", () => {
    const { engine, devtools } = setupDevtools(hub, scope);

    devtools.clearEvents();
    devtools.teardown!({} as RenderContext);

    engine.pause();
    engine.resume();

    // No events emitted after teardown
    expect(devtools.getEvents()).toHaveLength(0);
  });
});
