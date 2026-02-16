import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@ydant/core";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
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

  it("creates a plugin with correct name and types", () => {
    const plugin = createReactivePlugin();

    expect(plugin.name).toBe("reactive");
    expect(plugin.types).toEqual(["reactive"]);
  });

  it("renders reactive content", () => {
    const count = signal(0);

    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`Count: ${count()}`)]);
        }),
      {
        backend: createDOMBackend(container),
        plugins: [createBasePlugin(), createReactivePlugin()],
      },
    );

    expect(container.textContent).toContain("Count: 0");
  });

  it("updates when signal changes", () => {
    const count = signal(0);

    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`Count: ${count()}`)]);
        }),
      {
        backend: createDOMBackend(container),
        plugins: [createBasePlugin(), createReactivePlugin()],
      },
    );

    expect(container.textContent).toContain("Count: 0");

    // Update signal
    count.set(5);

    expect(container.textContent).toContain("Count: 5");
  });

  it("creates a span container with data-reactive attribute", () => {
    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text("Content")]);
        }),
      {
        backend: createDOMBackend(container),
        plugins: [createBasePlugin(), createReactivePlugin()],
      },
    );

    const reactiveSpan = container.querySelector("[data-reactive]");
    expect(reactiveSpan).not.toBeNull();
    expect(reactiveSpan?.tagName).toBe("SPAN");
  });

  it("clears and rebuilds content on signal change", () => {
    const items = signal([1, 2, 3]);

    mount(
      () =>
        div(function* () {
          yield* reactive(() => items().map((n) => text(`Item ${n} `)));
        }),
      {
        backend: createDOMBackend(container),
        plugins: [createBasePlugin(), createReactivePlugin()],
      },
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

    mount(
      () =>
        div(function* () {
          yield* reactive(() => [text(`A: ${count1()} `)]);
          yield* reactive(() => [text(`B: ${count2()}`)]);
        }),
      {
        backend: createDOMBackend(container),
        plugins: [createBasePlugin(), createReactivePlugin()],
      },
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

    mount(
      () =>
        div(function* () {
          yield* reactive(() => {
            renderCountA++;
            return [text(`A: ${countA()}`)];
          });
        }),
      {
        backend: createDOMBackend(containerA),
        plugins: [createBasePlugin(), createReactivePlugin()],
      },
    );

    mount(
      () =>
        div(function* () {
          yield* reactive(() => {
            renderCountB++;
            return [text(`B: ${countB()}`)];
          });
        }),
      {
        backend: createDOMBackend(containerB),
        plugins: [createBasePlugin(), createReactivePlugin()],
      },
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
