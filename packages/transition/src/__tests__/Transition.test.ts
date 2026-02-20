import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Builder } from "@ydant/core";
import { scope } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { createBasePlugin, createDOMBackend, div, text } from "@ydant/base";
import { Transition } from "../Transition";
import type { TransitionHandle } from "../Transition";
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

  it("defaults to hidden (show=false)", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        yield* Transition({
          content: () => div(() => [text("Hidden Content")]),
        });
      } as Builder),
    );

    expect(container.textContent).not.toContain("Hidden Content");
  });

  it("renders content when show=true", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        yield* Transition({
          show: true,
          content: () => div(() => [text("Visible Content")]),
        });
      } as Builder),
    );

    expect(container.textContent).toContain("Visible Content");
  });

  it("renders nothing when show=false", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        yield* Transition({
          show: false,
          content: () => div(() => [text("Hidden Content")]),
        });
      } as Builder),
    );

    expect(container.textContent).not.toContain("Hidden Content");
  });

  it("creates a handle with setShow function", () => {
    let handle: TransitionHandle | null = null;

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        handle = yield* Transition({
          enter: "fade-enter",
          enterFrom: "fade-enter-from",
          enterTo: "fade-enter-to",
          leave: "fade-leave",
          leaveFrom: "fade-leave-from",
          leaveTo: "fade-leave-to",
          content: () => div(() => [text("Transition Content")]),
        });
      } as Builder),
    );
    vi.advanceTimersToNextFrame();

    expect(handle).not.toBeNull();
    expect(handle!.slot).toBeDefined();
    expect(handle!.setShow).toBeInstanceOf(Function);
  });

  it("shows content with enter animation via setShow(true)", async () => {
    let handle: TransitionHandle | null = null;

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        handle = yield* Transition({
          enter: "fade-enter",
          enterFrom: "fade-enter-from",
          enterTo: "fade-enter-to",
          content: () => div({ class: "transition-child" }, () => [text("Content")]),
        });
      } as Builder),
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
    let handle: TransitionHandle | null = null;

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        handle = yield* Transition({
          leave: "fade-leave",
          leaveFrom: "fade-leave-from",
          leaveTo: "fade-leave-to",
          content: () => div({ class: "transition-child" }, () => [text("Content")]),
        });
      } as Builder),
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
    let handle: TransitionHandle | null = null;

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        handle = yield* Transition({
          content: () => div(() => [text("Content")]),
        });
      } as Builder),
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

    let handle: TransitionHandle | null = null;

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        handle = yield* Transition({
          enter: "fade-enter",
          content: () => div({ class: "child" }, () => [text("Content")]),
        });
      } as Builder),
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

  it("applies enter classes when show=true initially", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        yield* Transition({
          show: true,
          enter: "transition-opacity",
          enterFrom: "opacity-0",
          enterTo: "opacity-100",
          content: () => div({ class: "content-box" }, () => [text("Content")]),
        });
      } as Builder),
    );

    const childDiv = container.querySelector(".content-box") as HTMLElement;
    expect(childDiv).not.toBeNull();
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
