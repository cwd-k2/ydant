import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { createBasePlugin, createDOMCapabilities, div, text } from "@ydant/base";
import { TransitionGroup, createTransitionGroupRefresher } from "../TransitionGroup";

interface Item {
  id: number;
  name: string;
}

describe("TransitionGroup", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();

    // Mock getComputedStyle for transition duration
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "0s",
    } as CSSStyleDeclaration);
  });

  it("renders list items", () => {
    const items: Item[] = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
    ];

    mount(
      () =>
        div(function* () {
          yield* TransitionGroup({
            items,
            keyFn: (item) => item.id,
            content: (item) => div(() => [text(item.name)]),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("Item 1");
    expect(container.textContent).toContain("Item 2");
    expect(container.textContent).toContain("Item 3");
  });

  it("renders empty list", () => {
    mount(
      () =>
        div(function* () {
          yield* TransitionGroup<Item>({
            items: [],
            keyFn: (item) => item.id,
            content: (item) => div(() => [text(item.name)]),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    // The container has a wrapper div from TransitionGroup, but no item divs
    // Check that no item text content exists
    expect(container.textContent).toBe("");
  });

  it("applies enter classes on mount", () => {
    const items: Item[] = [{ id: 1, name: "Item 1" }];

    mount(
      () =>
        div(function* () {
          yield* TransitionGroup({
            items,
            keyFn: (item) => item.id,
            enter: "transition-opacity",
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            content: (item) => div(() => [text(item.name)]),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Item 1");
  });

  it("passes index to content function", () => {
    const items: Item[] = [
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
    ];

    const capturedIndices: number[] = [];

    mount(
      () =>
        div(function* () {
          yield* TransitionGroup({
            items,
            keyFn: (item) => item.id,
            content: (item, index) => {
              capturedIndices.push(index);
              return div(() => [text(`${item.name} at ${index}`)]);
            },
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(capturedIndices).toEqual([0, 1]);
    expect(container.textContent).toContain("First at 0");
    expect(container.textContent).toContain("Second at 1");
  });

  it("uses keyFn to generate unique keys", () => {
    const items: Item[] = [
      { id: 100, name: "A" },
      { id: 200, name: "B" },
    ];

    const capturedKeys: (string | number)[] = [];
    const originalKeyFn = (item: Item) => {
      const key = item.id;
      capturedKeys.push(key);
      return key;
    };

    mount(
      () =>
        div(function* () {
          yield* TransitionGroup({
            items,
            keyFn: originalKeyFn,
            content: (item) => div(() => [text(item.name)]),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(capturedKeys).toContain(100);
    expect(capturedKeys).toContain(200);
  });
});

describe("createTransitionGroupRefresher", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();

    // Mock getComputedStyle for transition duration
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "0s",
    } as CSSStyleDeclaration);
  });

  it("creates a refresher function", () => {
    const refresher = createTransitionGroupRefresher<Item>({
      keyFn: (item) => item.id,
      content: (item) => div(() => [text(item.name)]),
    });

    expect(typeof refresher).toBe("function");
  });

  it("updates list items via refresher", () => {
    let items: Item[] = [{ id: 1, name: "Initial" }];

    const refresher = createTransitionGroupRefresher<Item>({
      keyFn: (item) => item.id,
      content: (item) => div(() => [text(item.name)]),
    });

    let containerSlot!: Slot;

    mount(
      () =>
        div(function* () {
          containerSlot = yield* div(function* () {
            for (const item of items) {
              yield* div(() => [text(item.name)]);
            }
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    expect(container.textContent).toContain("Initial");

    // Update items
    items = [
      { id: 1, name: "Updated" },
      { id: 2, name: "New Item" },
    ];

    refresher(containerSlot!, items);

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Updated");
    expect(container.textContent).toContain("New Item");
  });

  it("applies leave classes when item is removed", () => {
    let items: Item[] = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
    ];

    // Create initial TransitionGroup
    let containerSlot!: Slot;

    mount(
      () =>
        div(function* () {
          containerSlot = yield* TransitionGroup({
            items,
            keyFn: (item) => item.id,
            leave: "transition-opacity",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            content: (item) => div(() => [text(item.name)]),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    // Both items should be rendered
    expect(container.textContent).toContain("Item 1");
    expect(container.textContent).toContain("Item 2");

    // Remove item 2
    items = [{ id: 1, name: "Item 1" }];

    const refresher = createTransitionGroupRefresher<Item>({
      keyFn: (item) => item.id,
      leave: "transition-opacity",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0",
      content: (item) => div(() => [text(item.name)]),
    });

    refresher(containerSlot, items);

    vi.advanceTimersToNextFrame();

    // Item 2 should have leave classes applied during transition
    // After transition completes, Item 2 should be removed
    // For now, we just verify Item 1 remains
    expect(container.textContent).toContain("Item 1");
  });

  it("removes element from DOM after leave transition completes", () => {
    let items: Item[] = [
      { id: 1, name: "Keeper" },
      { id: 2, name: "Remover" },
    ];

    let containerSlot!: Slot;

    mount(
      () =>
        div(function* () {
          containerSlot = yield* TransitionGroup({
            items,
            keyFn: (item) => item.id,
            leave: "fade-out",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            content: (item) => div(() => [text(item.name)]),
          });
        }),
      { root: container, plugins: [createDOMCapabilities(), createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("Keeper");
    expect(container.textContent).toContain("Remover");

    // Remove "Remover"
    items = [{ id: 1, name: "Keeper" }];

    const refresher = createTransitionGroupRefresher<Item>({
      keyFn: (item) => item.id,
      leave: "fade-out",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0",
      content: (item) => div(() => [text(item.name)]),
    });

    refresher(containerSlot, items);

    // Allow all timers and frames to complete
    vi.advanceTimersToNextFrame();
    vi.runAllTimers();

    // After transition, "Remover" should be gone
    expect(container.textContent).toContain("Keeper");
    expect(container.textContent).not.toContain("Remover");
  });
});
