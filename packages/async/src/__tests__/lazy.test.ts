import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scope, sync } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
import type { Slot } from "@ydant/base";
import { Lazy } from "../Lazy";
import { createAsyncPlugin } from "../plugin";

// ─── IntersectionObserver mock ───

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;

let observerCallback: IntersectionCallback | null = null;
let observerOptions: IntersectionObserverInit | undefined;
const mockDisconnect = vi.fn();
const mockObserve = vi.fn();

class MockIntersectionObserver {
  constructor(callback: IntersectionCallback, options?: IntersectionObserverInit) {
    observerCallback = callback;
    observerOptions = options;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

function triggerIntersection(isIntersecting: boolean) {
  observerCallback?.([{ isIntersecting } as IntersectionObserverEntry]);
}

// ─── requestIdleCallback mock ───

let idleCallbacks: Map<number, () => void>;
let nextIdleId: number;
const mockCancelIdleCallback = vi.fn((id: number) => {
  idleCallbacks.delete(id);
});

function mockRequestIdleCallback(cb: () => void): number {
  const id = nextIdleId++;
  idleCallbacks.set(id, cb);
  return id;
}

function flushIdleCallbacks() {
  for (const [, cb] of idleCallbacks) {
    cb();
  }
  idleCallbacks.clear();
}

/** Advance timers to fire rAF (which triggers onMount callbacks). */
function flushMount() {
  vi.advanceTimersByTime(16);
}

describe("Lazy", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();

    observerCallback = null;
    observerOptions = undefined;
    mockDisconnect.mockClear();
    mockObserve.mockClear();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    idleCallbacks = new Map();
    nextIdleId = 1;
    vi.stubGlobal("requestIdleCallback", mockRequestIdleCallback);
    vi.stubGlobal("cancelIdleCallback", mockCancelIdleCallback);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  // ─── trigger: "visible" ───

  it("renders fallback initially, then content when visible", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        Lazy({
          content: function* () {
            yield* text("Heavy Content");
          },
          fallback: function* () {
            yield* text("Loading...");
          },
          trigger: "visible",
        }),
      { scheduler: sync },
    );

    // Before onMount fires — fallback is visible, observer not yet set up
    expect(container.textContent).toContain("Loading...");

    // Fire rAF → onMount → IntersectionObserver set up
    flushMount();
    expect(mockObserve).toHaveBeenCalled();

    // Trigger visibility → content replaces fallback
    triggerIntersection(true);
    expect(container.textContent).toContain("Heavy Content");
    expect(container.textContent).not.toContain("Loading...");
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("does not activate when not intersecting", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        Lazy({
          content: function* () {
            yield* text("Content");
          },
          fallback: function* () {
            yield* text("Fallback");
          },
          trigger: "visible",
        }),
      { scheduler: sync },
    );

    flushMount();
    triggerIntersection(false);
    expect(container.textContent).toContain("Fallback");
    expect(container.textContent).not.toContain("Content");
  });

  it("passes rootMargin and threshold to IntersectionObserver", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        Lazy({
          content: function* () {
            yield* text("Content");
          },
          trigger: "visible",
          rootMargin: "200px",
          threshold: 0.5,
        }),
      { scheduler: sync },
    );

    flushMount();
    expect(observerOptions?.rootMargin).toBe("200px");
    expect(observerOptions?.threshold).toBe(0.5);
  });

  it("renders empty initially when no fallback is provided", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        Lazy({
          content: function* () {
            yield* text("Loaded");
          },
          trigger: "visible",
        }),
      { scheduler: sync },
    );

    // Container div exists but no text content
    expect(container.textContent).toBe("");

    flushMount();
    triggerIntersection(true);
    expect(container.textContent).toContain("Loaded");
  });

  it("disconnects observer when parent slot is refreshed", () => {
    let parentSlot!: Slot;

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      function* () {
        parentSlot = yield* div(function* () {
          yield* Lazy({
            content: function* () {
              yield* text("Content");
            },
            trigger: "visible",
          });
        });
      },
      { scheduler: sync },
    );

    flushMount();
    mockDisconnect.mockClear();

    // Refreshing parent slot triggers unmount of children (including Lazy's onMount cleanup)
    parentSlot.refresh(function* () {
      yield* text("Replaced");
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  // ─── trigger: "idle" ───

  it("renders content when idle callback fires", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        Lazy({
          content: function* () {
            yield* text("Idle Content");
          },
          fallback: function* () {
            yield* text("Waiting...");
          },
          trigger: "idle",
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Waiting...");

    // Fire rAF → onMount → requestIdleCallback registered
    flushMount();
    expect(container.textContent).toContain("Waiting...");

    // Fire idle callback → content
    flushIdleCallbacks();
    expect(container.textContent).toContain("Idle Content");
    expect(container.textContent).not.toContain("Waiting...");
  });

  it("cancels idle callback on unmount", () => {
    const handle = scope(createDOMBackend(container), [
      createBasePlugin(),
      createAsyncPlugin(),
    ]).mount(
      () =>
        Lazy({
          content: function* () {
            yield* text("Content");
          },
          trigger: "idle",
        }),
      { scheduler: sync },
    );

    flushMount();
    handle.dispose();
    expect(mockCancelIdleCallback).toHaveBeenCalled();
  });

  // ─── default trigger ───

  it("defaults to 'visible' trigger", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        Lazy({
          content: function* () {
            yield* text("Content");
          },
        }),
      { scheduler: sync },
    );

    flushMount();
    // IntersectionObserver should be used (default trigger is "visible")
    expect(mockObserve).toHaveBeenCalled();
  });
});
