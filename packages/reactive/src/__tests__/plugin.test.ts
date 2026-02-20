import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Plugin, RenderContext } from "@ydant/core";
import { scope, sync } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, li, text, onUnmount, keyed } from "@ydant/base";
import { signal } from "../signal";
import { reactive } from "../reactive";
import { createReactivePlugin } from "../plugin";

describe("createReactivePlugin", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
  });

  it("creates a plugin with correct name and types", () => {
    const plugin = createReactivePlugin();

    expect(plugin.name).toBe("reactive");
    expect(plugin.types).toEqual(["reactive"]);
  });

  it("renders reactive content", () => {
    const count = signal(0);

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`Count: ${count()}`)]);
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");
  });

  it("updates when signal changes", () => {
    const count = signal(0);

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`Count: ${count()}`)]);
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Update signal — sync scheduler means immediate re-render
    count.set(5);

    expect(container.textContent).toContain("Count: 5");
  });

  it("uses comment markers instead of span container", () => {
    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => [text("Content")]);
        }),
      { scheduler: sync },
    );

    // No span wrapper
    const reactiveSpan = container.querySelector("[data-reactive]");
    expect(reactiveSpan).toBeNull();

    // Comment markers exist around the content
    const outerDiv = container.querySelector("div")!;
    const children = Array.from(outerDiv.childNodes);
    const comments = children.filter((n) => n.nodeType === Node.COMMENT_NODE);
    expect(comments.length).toBe(2);
  });

  it("clears and rebuilds content on signal change", () => {
    const items = signal([1, 2, 3]);

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => items().map((n) => text(`Item ${n} `)));
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Item 1");
    expect(container.textContent).toContain("Item 2");
    expect(container.textContent).toContain("Item 3");

    // Update to different items
    items.set([4, 5]);

    expect(container.textContent).not.toContain("Item 1");
    expect(container.textContent).toContain("Item 4");
    expect(container.textContent).toContain("Item 5");
  });

  it("handles multiple reactive blocks", () => {
    const count1 = signal(0);
    const count2 = signal(100);

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`A: ${count1()} `)]);
          yield* reactive(() => [text(`B: ${count2()}`)]);
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("A: 0");
    expect(container.textContent).toContain("B: 100");

    count1.set(1);
    expect(container.textContent).toContain("A: 1");
    expect(container.textContent).toContain("B: 100");

    count2.set(200);
    expect(container.textContent).toContain("A: 1");
    expect(container.textContent).toContain("B: 200");
  });

  it("batches multiple signal updates in a single flush", async () => {
    const firstName = signal("John");
    const lastName = signal("Doe");
    let renderCount = 0;

    // Use default microtask scheduler (from DOM backend) to test batching
    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(() =>
      div(function* () {
        yield* reactive(() => {
          renderCount++;
          return [text(`${firstName()} ${lastName()}`)];
        });
      }),
    );

    expect(renderCount).toBe(1);
    expect(container.textContent).toContain("John Doe");

    // Multiple signal changes in same tick — should batch into one re-render
    firstName.set("Jane");
    lastName.set("Smith");

    // Not yet re-rendered (microtask pending)
    expect(renderCount).toBe(1);

    // Flush microtask
    await new Promise<void>((r) => queueMicrotask(r));

    // Only 1 additional render, not 2
    expect(renderCount).toBe(2);
    expect(container.textContent).toContain("Jane Smith");
  });
});

describe("reactive unmount callbacks", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
  });

  it("calls onUnmount callback on rerender", () => {
    const count = signal(0);
    const unmountFn = vi.fn();

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => [
            div(function* () {
              yield* text(`Count: ${count()}`);
              yield* onUnmount(unmountFn);
            }),
          ]);
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");
    expect(unmountFn).not.toHaveBeenCalled();

    // Trigger rerender — previous unmount callbacks should fire
    count.set(1);

    expect(container.textContent).toContain("Count: 1");
    expect(unmountFn).toHaveBeenCalledOnce();
  });

  it("calls onUnmount callbacks multiple times across rerenders", () => {
    const count = signal(0);
    const unmountFn = vi.fn();

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => [
            div(function* () {
              yield* text(`Count: ${count()}`);
              yield* onUnmount(unmountFn);
            }),
          ]);
        }),
      { scheduler: sync },
    );

    expect(unmountFn).not.toHaveBeenCalled();

    count.set(1);
    expect(unmountFn).toHaveBeenCalledTimes(1);

    count.set(2);
    expect(unmountFn).toHaveBeenCalledTimes(2);
  });
});

describe("handleRenderError integration", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
  });

  it("calls handleRenderError when rerender throws and handler exists", () => {
    const count = signal(0);
    const errorHandler = vi.fn(() => true);

    // A test plugin that sets handleRenderError on the context
    const testBoundaryPlugin: Plugin = {
      name: "test-boundary",
      types: [],
      initContext(ctx: RenderContext) {
        ctx.handleRenderError = errorHandler;
      },
    };

    scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
      testBoundaryPlugin,
    ]).mount(
      () =>
        div(function* () {
          yield* reactive(() => {
            const val = count();
            if (val > 0) throw new Error("boom");
            return [text(`Count: ${val}`)];
          });
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Trigger reactive update that throws
    count.set(1);

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
  });

  it("re-throws original error when handleRenderError itself throws", () => {
    const count = signal(0);

    const throwingHandler: Plugin = {
      name: "throwing-boundary",
      types: [],
      initContext(ctx: RenderContext) {
        ctx.handleRenderError = () => {
          throw new Error("handler exploded");
        };
      },
    };

    scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
      throwingHandler,
    ]).mount(
      () =>
        div(function* () {
          yield* reactive(() => {
            const val = count();
            if (val > 0) throw new Error("original error");
            return [text(`Count: ${val}`)];
          });
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // The original error should be re-thrown, not the handler's error
    expect(() => count.set(1)).toThrow("original error");
  });

  it("re-throws when no handleRenderError is set (backward compat)", () => {
    const count = signal(0);

    const { dispose } = scope(createDOMBackend(container), [
      createBasePlugin(),
      createReactivePlugin(),
    ]).mount(
      () =>
        div(function* () {
          yield* reactive(() => {
            const val = count();
            if (val > 0) throw new Error("boom");
            return [text(`Count: ${val}`)];
          });
        }),
      { scheduler: sync },
    );

    expect(container.textContent).toContain("Count: 0");

    // Without a handler, the error should propagate
    expect(() => count.set(1)).toThrow("boom");

    dispose();
  });
});

describe("reactive keyed() support", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
  });

  it("reuses DOM nodes with keyed() across signal changes", () => {
    const items = signal([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => items().map((item) => keyed(item.id, li)(() => [text(item.name)])));
        }),
      { scheduler: sync },
    );

    // Content is directly inside the outer div (between comment markers)
    const outerDiv = container.querySelector("div")!;
    const liElements = outerDiv.querySelectorAll("li");
    const firstLi = liElements[0];
    const secondLi = liElements[1];
    expect(firstLi.textContent).toBe("A");
    expect(secondLi.textContent).toBe("B");

    // Update signal — same keys, different content
    items.set([
      { id: 1, name: "A updated" },
      { id: 2, name: "B updated" },
    ]);

    // DOM nodes should be reused (same reference)
    const updatedLis = outerDiv.querySelectorAll("li");
    expect(updatedLis[0]).toBe(firstLi);
    expect(updatedLis[1]).toBe(secondLi);
    expect(firstLi.textContent).toBe("A updated");
    expect(secondLi.textContent).toBe("B updated");
  });

  it("reorders DOM nodes correctly with keyed()", () => {
    const items = signal([
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
      { id: 3, name: "Third" },
    ]);

    scope(createDOMBackend(container), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => items().map((item) => keyed(item.id, li)(() => [text(item.name)])));
        }),
      { scheduler: sync },
    );

    const outerDiv = container.querySelector("div")!;
    const liElements = outerDiv.querySelectorAll("li");
    const originalFirst = liElements[0];
    const originalSecond = liElements[1];
    const originalThird = liElements[2];

    // Reverse order
    items.set([
      { id: 3, name: "Third" },
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
    ]);

    // Nodes should be reused and reordered
    const reorderedLis = outerDiv.querySelectorAll("li");
    expect(reorderedLis[0]).toBe(originalThird);
    expect(reorderedLis[1]).toBe(originalFirst);
    expect(reorderedLis[2]).toBe(originalSecond);
  });
});

describe("ReactiveScope isolation", () => {
  let containerA: HTMLElement;
  let containerB: HTMLElement;

  beforeEach(() => {
    containerA = document.createElement("div");
    containerB = document.createElement("div");
    document.body.appendChild(containerA);
    document.body.appendChild(containerB);
  });

  afterEach(() => {
    containerA.remove();
    containerB.remove();
  });

  it("independent mount() instances do not interfere with each other", () => {
    const countA = signal(0);
    const countB = signal(100);
    let renderCountA = 0;
    let renderCountB = 0;

    scope(createDOMBackend(containerA), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => {
            renderCountA++;
            return [text(`A: ${countA()}`)];
          });
        }),
      { scheduler: sync },
    );

    scope(createDOMBackend(containerB), [createBasePlugin(), createReactivePlugin()]).mount(
      () =>
        div(function* () {
          yield* reactive(() => {
            renderCountB++;
            return [text(`B: ${countB()}`)];
          });
        }),
      { scheduler: sync },
    );

    expect(containerA.textContent).toContain("A: 0");
    expect(containerB.textContent).toContain("B: 100");
    expect(renderCountA).toBe(1);
    expect(renderCountB).toBe(1);

    // Changing countA should only re-render mount A
    countA.set(1);
    expect(containerA.textContent).toContain("A: 1");
    expect(containerB.textContent).toContain("B: 100");
    expect(renderCountA).toBe(2);
    expect(renderCountB).toBe(1);

    // Changing countB should only re-render mount B
    countB.set(200);
    expect(containerA.textContent).toContain("A: 1");
    expect(containerB.textContent).toContain("B: 200");
    expect(renderCountA).toBe(2);
    expect(renderCountB).toBe(2);
  });
});
