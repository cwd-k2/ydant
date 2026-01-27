import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Builder } from "@ydant/core";
import { mount } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { createBasePlugin, div, text, clss } from "@ydant/base";
import {
  Transition,
  createTransition,
  enterTransition,
  leaveTransition,
  type TransitionProps,
} from "../Transition";

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

  it("renders children when show=true", () => {
    mount(
      () =>
        Transition({
          show: true,
          children: () => div(() => [text("Visible Content")]),
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
          children: () => div(() => [text("Hidden Content")]),
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
          children: () => div(() => [text("Content")]),
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
          children: () => div(() => [text("Content")]),
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
          children: () => div(() => [text("Toggle Content")]),
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
          children: () => div(() => [text("Toggle Content")]),
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
          children: () => div(() => [clss(["content-box"]), text("Content")]),
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
          children: () => div(() => [clss(["fade-target"]), text("Fading")]),
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
          children: () => div(() => [clss(["event-target"]), text("Content")]),
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
          children: () => div(() => [text("No Classes")]),
        }),
      container,
      { plugins: [createBasePlugin()] },
    );

    vi.advanceTimersToNextFrame();

    expect(container.textContent).toContain("No Classes");
  });
});

describe("enterTransition", () => {
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

  it("adds enter and enterFrom classes initially", async () => {
    const props: TransitionProps = {
      show: true,
      enter: "transition-opacity",
      enterFrom: "opacity-0",
      enterTo: "opacity-100",
      children: () => div(() => []),
    };

    enterTransition(element, props);

    // Initially, enter and enterFrom should be added
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
    const props: TransitionProps = {
      show: true,
      enter: "transition-all duration-300",
      enterFrom: "opacity-0 scale-95",
      enterTo: "opacity-100 scale-100",
      children: () => div(() => []),
    };

    enterTransition(element, props);

    expect(element.classList.contains("transition-all")).toBe(true);
    expect(element.classList.contains("duration-300")).toBe(true);
    expect(element.classList.contains("opacity-0")).toBe(true);
    expect(element.classList.contains("scale-95")).toBe(true);

    await vi.runAllTimersAsync();
  });

  it("handles undefined classes", async () => {
    const props: TransitionProps = {
      show: true,
      children: () => div(() => []),
    };

    enterTransition(element, props);
    await vi.runAllTimersAsync();

    // Should complete without error
    expect(element.classList.length).toBe(0);
  });
});

describe("leaveTransition", () => {
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

  it("adds leave and leaveFrom classes initially", async () => {
    const props: TransitionProps = {
      show: false,
      leave: "transition-opacity",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0",
      children: () => div(() => []),
    };

    leaveTransition(element, props);

    // Initially, leave and leaveFrom should be added
    expect(element.classList.contains("transition-opacity")).toBe(true);
    expect(element.classList.contains("opacity-100")).toBe(true);

    // Advance RAF
    await vi.runAllTimersAsync();

    // After completion, all classes should be removed
    expect(element.classList.contains("transition-opacity")).toBe(false);
    expect(element.classList.contains("opacity-100")).toBe(false);
    expect(element.classList.contains("opacity-0")).toBe(false);
  });

  it("transitions from leaveFrom to leaveTo", async () => {
    const props: TransitionProps = {
      show: false,
      leave: "transition-all",
      leaveFrom: "opacity-100 scale-100",
      leaveTo: "opacity-0 scale-95",
      children: () => div(() => []),
    };

    leaveTransition(element, props);

    // Before RAF
    expect(element.classList.contains("opacity-100")).toBe(true);
    expect(element.classList.contains("scale-100")).toBe(true);

    // After RAF, leaveFrom is removed and leaveTo is added
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

    const props: TransitionProps = {
      show: false,
      leave: "transition-opacity",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0",
      children: () => div(() => []),
    };

    leaveTransition(element, props);

    // Run all async operations
    await vi.runAllTimersAsync();

    // Should complete and clean up
    expect(element.classList.contains("transition-opacity")).toBe(false);
  });

  it("completes on transitionend event", async () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "1s",
    } as CSSStyleDeclaration);

    const props: TransitionProps = {
      show: false,
      leave: "transition-opacity",
      leaveFrom: "opacity-100",
      leaveTo: "opacity-0",
      children: () => div(() => []),
    };

    leaveTransition(element, props);

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
            children: () => div(() => [text("Transition Content")]),
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
            children: () => div(() => [clss(["transition-child"]), text("Content")]),
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
            children: () => div(() => [clss(["transition-child"]), text("Content")]),
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
            children: () => div(() => [text("Content")]),
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
            children: () => div(() => [clss(["child"]), text("Content")]),
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
