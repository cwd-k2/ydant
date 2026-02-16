import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHub } from "../hub";
import { sync, microtask } from "../scheduler";
import type { Backend, ExecutionScope, Hub } from "../plugin";

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

// ---------------------------------------------------------------------------
// Scheduler tests
// ---------------------------------------------------------------------------

describe("Schedulers", () => {
  it("sync executes flush immediately", () => {
    const flush = vi.fn();
    sync(flush);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it("microtask defers flush to microtask", async () => {
    const flush = vi.fn();
    microtask(flush);
    expect(flush).not.toHaveBeenCalled();
    await new Promise<void>((r) => queueMicrotask(r));
    expect(flush).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Engine tests
// ---------------------------------------------------------------------------

describe("Engine", () => {
  let hub: Hub;

  beforeEach(() => {
    hub = createHub();
  });

  it("enqueue + sync scheduler executes task immediately", () => {
    const scope = createMockScope();
    const engine = hub.spawn("e1", scope, { scheduler: sync });

    const task = vi.fn();
    engine.enqueue(task);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("deduplicates same function reference within a flush cycle", async () => {
    const scope = createMockScope();
    const engine = hub.spawn("e1", scope, { scheduler: microtask });

    const task = vi.fn();
    // Enqueue same reference three times before flush
    engine.enqueue(task);
    engine.enqueue(task);
    engine.enqueue(task);

    // Set dedup: only one instance in the queue
    await new Promise<void>((r) => queueMicrotask(r));
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("deduplicates within same flush cycle (microtask scheduler)", async () => {
    const scope = createMockScope();
    const engine = hub.spawn("e1", scope, { scheduler: microtask });

    const task = vi.fn();
    engine.enqueue(task);
    engine.enqueue(task);
    engine.enqueue(task);

    expect(task).not.toHaveBeenCalled();
    await new Promise<void>((r) => queueMicrotask(r));
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("stop prevents further task execution", () => {
    const scope = createMockScope();
    const engine = hub.spawn("e1", scope, { scheduler: sync });

    engine.stop();

    const task = vi.fn();
    engine.enqueue(task);

    expect(task).not.toHaveBeenCalled();
  });

  it("uses backend defaultScheduler when no scheduler is specified", async () => {
    const backend: Backend = {
      name: "mock",
      root: {},
      initContext() {},
      defaultScheduler: microtask,
    };
    const scope: ExecutionScope = {
      backend,
      pluginMap: new Map(),
      allPlugins: [],
    };

    const engine = hub.spawn("e1", scope);

    const task = vi.fn();
    engine.enqueue(task);

    // Should use microtask (from backend), not sync
    expect(task).not.toHaveBeenCalled();
    await new Promise<void>((r) => queueMicrotask(r));
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("falls back to sync when no scheduler is provided anywhere", () => {
    const scope = createMockScope();
    const engine = hub.spawn("e1", scope);

    const task = vi.fn();
    engine.enqueue(task);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("tasks enqueued during flush are not executed in the same cycle", async () => {
    const scope = createMockScope();
    const flushes: Array<() => void> = [];
    // Manual scheduler: captures flush calls for controlled execution
    const manualScheduler = (flush: () => void) => flushes.push(flush);
    const engine = hub.spawn("e1", scope, { scheduler: manualScheduler });

    const order: number[] = [];
    const task2 = () => order.push(2);
    const task1 = () => {
      order.push(1);
      engine.enqueue(task2);
    };

    engine.enqueue(task1);

    // First flush: only task1 runs, task2 is enqueued for next round
    expect(flushes).toHaveLength(1);
    flushes[0]();
    expect(order).toEqual([1]);

    // task2 triggered a new scheduleFlush
    expect(flushes).toHaveLength(2);
    flushes[1]();
    expect(order).toEqual([1, 2]);
  });
});

// ---------------------------------------------------------------------------
// Hub tests
// ---------------------------------------------------------------------------

describe("Hub", () => {
  it("spawn creates an engine retrievable by get", () => {
    const hub = createHub();
    const scope = createMockScope();
    const engine = hub.spawn("main", scope);

    expect(hub.get("main")).toBe(engine);
  });

  it("spawn throws on duplicate id", () => {
    const hub = createHub();
    const scope = createMockScope();
    hub.spawn("main", scope);

    expect(() => hub.spawn("main", createMockScope())).toThrow('"main" already exists');
  });

  it("resolve finds engine by scope", () => {
    const hub = createHub();
    const scope = createMockScope();
    const engine = hub.spawn("main", scope);

    expect(hub.resolve(scope)).toBe(engine);
  });

  it("resolve returns undefined for unknown scope", () => {
    const hub = createHub();
    expect(hub.resolve(createMockScope())).toBeUndefined();
  });

  it("dispatch delivers message to target engine", () => {
    const hub = createHub();
    const scope = createMockScope();
    const engine = hub.spawn("main", scope);

    const handler = vi.fn();
    engine.on("test-msg", handler);

    hub.dispatch(engine, { type: "test-msg", data: 42 });

    expect(handler).toHaveBeenCalledWith({ type: "test-msg", data: 42 });
  });

  it("dispatch by scope resolves and delivers", () => {
    const hub = createHub();
    const scope = createMockScope();
    const engine = hub.spawn("main", scope);

    const handler = vi.fn();
    engine.on("ping", handler);

    hub.dispatch(scope, { type: "ping" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("dispatch to unknown scope is a no-op", () => {
    const hub = createHub();
    // Should not throw
    hub.dispatch(createMockScope(), { type: "ping" });
  });

  it("dispose stops all engines", () => {
    const hub = createHub();
    const engine1 = hub.spawn("e1", createMockScope("s1"), { scheduler: sync });
    const engine2 = hub.spawn("e2", createMockScope("s2"), { scheduler: sync });

    hub.dispose();

    const task = vi.fn();
    engine1.enqueue(task);
    engine2.enqueue(task);

    expect(task).not.toHaveBeenCalled();
    expect(hub.get("e1")).toBeUndefined();
    expect(hub.get("e2")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

describe("Message handling", () => {
  it("multiple handlers for same type all receive the message", () => {
    const hub = createHub();
    const engine = hub.spawn("e1", createMockScope());

    const handler1 = vi.fn();
    const handler2 = vi.fn();
    engine.on("event", handler1);
    engine.on("event", handler2);

    hub.dispatch(engine, { type: "event" });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("handlers for different types are independent", () => {
    const hub = createHub();
    const engine = hub.spawn("e1", createMockScope());

    const handlerA = vi.fn();
    const handlerB = vi.fn();
    engine.on("type-a", handlerA);
    engine.on("type-b", handlerB);

    hub.dispatch(engine, { type: "type-a" });

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).not.toHaveBeenCalled();
  });
});
