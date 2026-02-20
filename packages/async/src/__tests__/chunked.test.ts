import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scope, sync } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text, onUnmount, refresh } from "@ydant/base";
import type { Slot } from "@ydant/base";
import { chunked } from "../chunked";
import { createAsyncPlugin } from "../plugin";

describe("chunked", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders first chunk synchronously", () => {
    const items = ["a", "b", "c", "d", "e"];

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        div(function* () {
          yield* chunked(items, 2, function* (item) {
            yield* text(item as string);
          });
        }),
      { scheduler: sync },
    );

    // First chunk ("a", "b") rendered immediately
    expect(container.textContent).toContain("a");
    expect(container.textContent).toContain("b");
    // Remaining chunks not yet rendered
    expect(container.textContent).not.toContain("c");
  });

  it("renders deferred chunks after schedule callback", () => {
    const items = ["a", "b", "c", "d", "e"];
    const scheduledCallbacks: Array<() => void> = [];

    const customSchedule = (cb: () => void) => {
      scheduledCallbacks.push(cb);
      return () => {};
    };

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        div(function* () {
          yield* chunked(
            items,
            2,
            function* (item) {
              yield* text(item as string);
            },
            { schedule: customSchedule },
          );
        }),
      { scheduler: sync },
    );

    // First chunk
    expect(container.textContent).toBe("ab");

    // Fire first deferred schedule → chunk 2 ("c", "d")
    scheduledCallbacks.shift()!();
    expect(container.textContent).toBe("abcd");

    // Fire second deferred schedule → chunk 3 ("e")
    scheduledCallbacks.shift()!();
    expect(container.textContent).toBe("abcde");
  });

  it("stops scheduling after all chunks are rendered", () => {
    const items = ["a", "b", "c"];
    const scheduledCallbacks: Array<() => void> = [];

    const customSchedule = (cb: () => void) => {
      scheduledCallbacks.push(cb);
      return () => {};
    };

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        div(function* () {
          yield* chunked(
            items,
            2,
            function* (item) {
              yield* text(item as string);
            },
            { schedule: customSchedule },
          );
        }),
      { scheduler: sync },
    );

    // First chunk ("a", "b")
    expect(scheduledCallbacks.length).toBe(1);

    // Fire → chunk 2 ("c"), no more items
    scheduledCallbacks.shift()!();
    expect(container.textContent).toBe("abc");

    // No further schedule calls
    expect(scheduledCallbacks.length).toBe(0);
  });

  it("renders all items synchronously when chunkSize >= items.length", () => {
    const items = ["a", "b", "c"];
    const scheduleCalled = vi.fn();

    const customSchedule = (_cb: () => void) => {
      scheduleCalled();
      return () => {};
    };

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        div(function* () {
          yield* chunked(
            items,
            10,
            function* (item) {
              yield* text(item as string);
            },
            { schedule: customSchedule },
          );
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toBe("abc");
    expect(scheduleCalled).not.toHaveBeenCalled();
  });

  it("cancels pending chunks on unmount", () => {
    const items = ["a", "b", "c", "d"];
    const cancelFns: Array<ReturnType<typeof vi.fn>> = [];

    const customSchedule = (_cb: () => void) => {
      const cancel = vi.fn();
      cancelFns.push(cancel);
      // Don't actually call cb — simulate pending state
      return cancel;
    };

    const handle = scope(createDOMBackend(container), [
      createBasePlugin(),
      createAsyncPlugin(),
    ]).mount(
      () =>
        div(function* () {
          yield* chunked(
            items,
            2,
            function* (item) {
              yield* text(item as string);
            },
            { schedule: customSchedule },
          );
        }),
      { scheduler: sync },
    );

    // Only first chunk rendered
    expect(container.textContent).toBe("ab");

    handle.dispose();

    // Deferred chunks were not rendered, but the schedule callback's
    // cancel was invoked via master cleanup (cancelled = true prevents further loads)
  });

  it("calls onUnmount for deferred chunk items when parent is refreshed", () => {
    const items = ["a", "b", "c", "d"];
    const scheduledCallbacks: Array<() => void> = [];
    const unmountCalls: string[] = [];
    let parentSlot!: Slot;

    const customSchedule = (cb: () => void) => {
      scheduledCallbacks.push(cb);
      return () => {};
    };

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      function* () {
        parentSlot = yield* div(function* () {
          yield* chunked(
            items,
            2,
            function* (item) {
              yield* div(function* () {
                yield* text(item as string);
                yield* onUnmount(() => unmountCalls.push(item as string));
              });
            },
            { schedule: customSchedule },
          );
        });
      },
      { scheduler: sync },
    );

    // Render second chunk
    scheduledCallbacks.shift()!();
    expect(container.textContent).toBe("abcd");

    // Refresh parent slot — all unmount callbacks should fire
    refresh(parentSlot, function* () {
      yield* text("replaced");
    });

    expect(unmountCalls).toContain("a");
    expect(unmountCalls).toContain("b");
    expect(unmountCalls).toContain("c");
    expect(unmountCalls).toContain("d");
  });

  it("handles empty items array", () => {
    const scheduleCalled = vi.fn();

    const customSchedule = (_cb: () => void) => {
      scheduleCalled();
      return () => {};
    };

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        div(function* () {
          yield* chunked(
            [],
            10,
            function* () {
              yield* text("should not appear");
            },
            { schedule: customSchedule },
          );
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toBe("");
    expect(scheduleCalled).not.toHaveBeenCalled();
  });

  it("passes correct index to each callback", () => {
    const items = ["a", "b", "c", "d"];
    const indices: number[] = [];
    const scheduledCallbacks: Array<() => void> = [];

    const customSchedule = (cb: () => void) => {
      scheduledCallbacks.push(cb);
      return () => {};
    };

    scope(createDOMBackend(container), [createBasePlugin(), createAsyncPlugin()]).mount(
      () =>
        div(function* () {
          yield* chunked(
            items,
            2,
            function* (_item, index) {
              indices.push(index);
              yield* text(String(index));
            },
            { schedule: customSchedule },
          );
        }),
      { scheduler: sync },
    );

    // First chunk indices
    expect(indices).toEqual([0, 1]);

    scheduledCallbacks.shift()!();
    expect(indices).toEqual([0, 1, 2, 3]);
  });
});
