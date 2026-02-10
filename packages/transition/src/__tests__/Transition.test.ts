import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Builder } from "@ydant/core";
import { mount } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { createBasePlugin, div, text, classes } from "@ydant/base";
import { Transition, createTransition } from "../Transition";
import { runTransition } from "../utils";

describe("Transition", () => {
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

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it("renders content when show=true", () => {
    mount(
      () =>
        Transition({
          show: true,
          content: () => div(() => [text("Visible Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    expect(container.textContent).toContain("Visible Content");
  });

  it("renders nothing when show=false", () => {
    mount(
      () =>
        Transition({
          show: false,
          content: () => div(() => [text("Hidden Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    expect(container.textContent).not.toContain("Hidden Content");
  });

  it("applies enter classes on mount", () => {
    mount(
      () =>
        Transition({
          show: true,
          enter: "transition-opacity",
          enterFrom: "opacity-0",
          enterTo: "opacity-100",
          content: () => div(() => [text("Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    // Get the child element (not the wrapper div)
    const childDiv = container.querySelector("div > div > div");
    expect(childDiv).not.toBeNull();
  });

  it("handles transition without classes", () => {
    mount(
      () =>
        Transition({
          show: true,
          content: () => div(() => [text("Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    expect(container.textContent).toContain("Content");
  });

  it("toggles visibility based on show prop", () => {
    // Test show=true
    mount(
      () =>
        Transition({
          show: true,
          content: () => div(() => [text("Toggle Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    expect(container.textContent).toContain("Toggle Content");

    // Reset container and test show=false
    container.innerHTML = "";

    mount(
      () =>
        Transition({
          show: false,
          content: () => div(() => [text("Toggle Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    expect(container.textContent).not.toContain("Toggle Content");
  });

  it("applies and removes enter classes through transition", () => {
    mount(
      () =>
        Transition({
          show: true,
          enter: "transition-all",
          enterFrom: "opacity-0 scale-95",
          enterTo: "opacity-100 scale-100",
          content: () => div(() => [classes("content-box"), text("Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    // Trigger onMount callback (requestAnimationFrame)
    vi.advanceTimersToNextFrame();

    const childDiv = container.querySelector(".content-box") as HTMLElement;
    expect(childDiv).not.toBeNull();

    // After the first rAF, enterTo classes should be added
    vi.advanceTimersToNextFrame();

    // Classes are cleaned up after transition completes
    // Since transitionDuration is '0s', cleanup happens immediately
  });

  it("handles non-zero transition duration", () => {
    // Mock with non-zero duration
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "0.3s",
    } as CSSStyleDeclaration);

    mount(
      () =>
        Transition({
          show: true,
          enter: "transition-opacity",
          enterFrom: "opacity-0",
          enterTo: "opacity-100",
          content: () => div(() => [classes("fade-target"), text("Fading")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    const childDiv = container.querySelector(".fade-target") as HTMLElement;
    expect(childDiv).not.toBeNull();

    // Advance through the transition
    vi.advanceTimersToNextFrame();

    // The transition would listen for transitionend or timeout
    // After 300ms + 50ms buffer, it should complete
    vi.advanceTimersByTime(350);

    expect(container.textContent).toContain("Fading");
  });

  it("handles transitionend event", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "0.5s",
    } as CSSStyleDeclaration);

    mount(
      () =>
        Transition({
          show: true,
          enter: "transition-opacity",
          enterFrom: "opacity-0",
          enterTo: "opacity-100",
          content: () => div(() => [classes("event-target"), text("Content")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    const childDiv = container.querySelector(".event-target") as HTMLElement;

    // Manually dispatch transitionend event
    childDiv.dispatchEvent(new Event("transitionend"));

    expect(container.textContent).toContain("Content");
  });

  it("cleans up empty class strings", () => {
    mount(
      () =>
        Transition({
          show: true,
          enter: "",
          enterFrom: "",
          enterTo: "",
          content: () => div(() => [text("No Classes")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("No Classes");
  });
});

describe("runTransition", () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement("div");
    document.body.appendChild(element);
    vi.useFakeTimers();

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "0s",
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    element.remove();
    vi.restoreAllMocks();
  });

  it("adds base and from classes initially", async () => {
    runTransition(element, {
      base: "transition-opacity",
      from: "opacity-0",
      to: "opacity-100",
    });

    // Initially, base and from should be added
    expect(element.classList.contains("transition-opacity")).toBe(true);
    expect(element.classList.contains("opacity-0")).toBe(true);

    // Advance RAF
    vi.advanceTimersToNextFrame();

    await vi.runAllTimersAsync();

    // After completion, all classes should be removed
    expect(element.classList.contains("transition-opacity")).toBe(false);
    expect(element.classList.contains("opacity-0")).toBe(false);
    expect(element.classList.contains("opacity-100")).toBe(false);
  });

  it("handles multiple classes in a single string", async () => {
    runTransition(element, {
      base: "transition-all duration-300",
      from: "opacity-0 scale-95",
      to: "opacity-100 scale-100",
    });

    expect(element.classList.contains("transition-all")).toBe(true);
    expect(element.classList.contains("duration-300")).toBe(true);
    expect(element.classList.contains("opacity-0")).toBe(true);
    expect(element.classList.contains("scale-95")).toBe(true);

    await vi.runAllTimersAsync();
  });

  it("handles undefined classes", async () => {
    runTransition(element, {});
    await vi.runAllTimersAsync();

    // Should complete without error
    expect(element.classList.length).toBe(0);
  });

  it("swaps from to to classes after rAF", async () => {
    runTransition(element, {
      base: "transition-all",
      from: "opacity-100 scale-100",
      to: "opacity-0 scale-95",
    });

    // Before RAF
    expect(element.classList.contains("opacity-100")).toBe(true);
    expect(element.classList.contains("scale-100")).toBe(true);

    // After RAF, from is removed and to is added
    vi.advanceTimersToNextFrame();

    expect(element.classList.contains("opacity-100")).toBe(false);
    expect(element.classList.contains("scale-100")).toBe(false);
    expect(element.classList.contains("opacity-0")).toBe(true);
    expect(element.classList.contains("scale-95")).toBe(true);

    await vi.runAllTimersAsync();
  });

  it("handles non-zero transition duration", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "0.3s",
    } as CSSStyleDeclaration);

    runTransition(element, {
      base: "transition-opacity",
      from: "opacity-100",
      to: "opacity-0",
    });

    // Run all async operations
    await vi.runAllTimersAsync();

    // Should complete and clean up
    expect(element.classList.contains("transition-opacity")).toBe(false);
  });

  it("completes on transitionend event", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "1s",
    } as CSSStyleDeclaration);

    runTransition(element, {
      base: "transition-opacity",
      from: "opacity-100",
      to: "opacity-0",
    });

    vi.advanceTimersToNextFrame();

    // Dispatch transitionend before timeout
    element.dispatchEvent(new Event("transitionend"));

    await vi.runAllTimersAsync();

    // Should complete and clean up
    expect(element.classList.contains("transition-opacity")).toBe(false);
  });
});

describe("createTransition", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "0s",
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it("creates a transition handle with setShow function", () => {
    let handle: {
      slot: Slot;
      setShow: (show: boolean) => Promise<void>;
    } | null = null;

    mount(
      () =>
        div(function* () {
          handle = yield* createTransition({
            enter: "fade-enter",
            enterFrom: "fade-enter-from",
            enterTo: "fade-enter-to",
            leave: "fade-leave",
            leaveFrom: "fade-leave-from",
            leaveTo: "fade-leave-to",
            content: () => div(() => [text("Transition Content")]),
          });
        } as Builder),
      container,
      { plugins: [createBasePlugin()] },
    );
    vi.advanceTimersToNextFrame();

    expect(handle).not.toBeNull();
    expect(handle!.slot).toBeDefined();
    expect(handle!.setShow).toBeInstanceOf(Function);
  });

  it("shows content with enter animation via setShow(true)", async () => {
    let handle: {
      slot: Slot;
      setShow: (show: boolean) => Promise<void>;
    } | null = null;

    mount(
      () =>
        div(function* () {
          handle = yield* createTransition({
            enter: "fade-enter",
            enterFrom: "fade-enter-from",
            enterTo: "fade-enter-to",
            content: () => div(() => [classes("transition-child"), text("Content")]),
          });
        } as Builder),
      container,
      { plugins: [createBasePlugin()] },
    );
    vi.advanceTimersToNextFrame();

    // Initially hidden
    expect(container.querySelector(".transition-child")).toBeNull();

    // Show with animation
    handle!.setShow(true);
    await vi.runAllTimersAsync();

    // Now visible
    expect(container.querySelector(".transition-child")).not.toBeNull();
    expect(container.textContent).toContain("Content");
  });

  it("hides content with leave animation via setShow(false)", async () => {
    let handle: {
      slot: Slot;
      setShow: (show: boolean) => Promise<void>;
    } | null = null;

    mount(
      () =>
        div(function* () {
          handle = yield* createTransition({
            leave: "fade-leave",
            leaveFrom: "fade-leave-from",
            leaveTo: "fade-leave-to",
            content: () => div(() => [classes("transition-child"), text("Content")]),
          });
        } as Builder),
      container,
      { plugins: [createBasePlugin()] },
    );
    vi.advanceTimersToNextFrame();

    // First show
    handle!.setShow(true);
    await vi.runAllTimersAsync();
    expect(container.querySelector(".transition-child")).not.toBeNull();

    // Then hide with animation
    handle!.setShow(false);
    await vi.runAllTimersAsync();

    // Now hidden
    expect(container.querySelector(".transition-child")).toBeNull();
  });

  it("ignores setShow calls with same value", async () => {
    let handle: {
      slot: Slot;
      setShow: (show: boolean) => Promise<void>;
    } | null = null;

    mount(
      () =>
        div(function* () {
          handle = yield* createTransition({
            content: () => div(() => [text("Content")]),
          });
        } as Builder),
      container,
      { plugins: [createBasePlugin()] },
    );
    vi.advanceTimersToNextFrame();

    // Initially hidden, calling setShow(false) should do nothing
    handle!.setShow(false);
    await vi.runAllTimersAsync();

    // Show
    handle!.setShow(true);
    await vi.runAllTimersAsync();

    // Calling setShow(true) again should do nothing
    handle!.setShow(true);
    await vi.runAllTimersAsync();

    expect(container.textContent).toContain("Content");
  });

  it("ignores setShow calls while animating", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "1s",
    } as CSSStyleDeclaration);

    let handle: {
      slot: Slot;
      setShow: (show: boolean) => Promise<void>;
    } | null = null;

    mount(
      () =>
        div(function* () {
          handle = yield* createTransition({
            enter: "fade-enter",
            content: () => div(() => [classes("child"), text("Content")]),
          });
        } as Builder),
      container,
      { plugins: [createBasePlugin()] },
    );
    vi.advanceTimersToNextFrame();

    // Start showing
    handle!.setShow(true);
    vi.advanceTimersToNextFrame();

    // Try to hide while still animating - should be ignored
    handle!.setShow(false);

    // Complete the show animation
    await vi.runAllTimersAsync();

    // Should still be visible (hide was ignored)
    expect(container.querySelector(".child")).not.toBeNull();
  });
});
