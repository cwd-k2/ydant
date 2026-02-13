import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import type { Component } from "@ydant/core";
import { div, span, p, button, text, attr, classes, on, onMount } from "@ydant/base";
import type { Slot } from "@ydant/base";
import { renderToString } from "../render";
import { hydrate } from "../hydrate";

describe("hydrate", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  /** Helper: set SSR HTML and hydrate */
  function ssrAndHydrate(app: Component) {
    const html = renderToString(app);
    container.innerHTML = html;
    return hydrate(app, container);
  }

  test("preserves existing DOM structure", () => {
    const App: Component = () => div(() => [text("Hello")]);

    ssrAndHydrate(App);

    expect(container.innerHTML).toBe("<div>Hello</div>");
  });

  test("attaches event listeners to existing elements", () => {
    const handler = vi.fn();
    const App: Component = () => button(() => [on("click", handler), text("Click me")]);

    ssrAndHydrate(App);

    // DOM should be unchanged
    expect(container.innerHTML).toBe("<button>Click me</button>");

    // But clicking should work now
    container.querySelector("button")!.click();
    expect(handler).toHaveBeenCalledOnce();
  });

  test("preserves attributes from SSR", () => {
    const App: Component = () =>
      div(() => [attr("id", "main"), classes("container"), text("content")]);

    ssrAndHydrate(App);

    const el = container.querySelector("div")!;
    expect(el.getAttribute("id")).toBe("main");
    expect(el.getAttribute("class")).toBe("container");
    expect(el.textContent).toBe("content");
  });

  test("handles nested components", () => {
    function* Inner() {
      yield* span(() => [text("inner")]);
    }

    const App: Component = function* () {
      yield* div(function* () {
        yield* text("before ");
        yield* Inner();
        yield* text(" after");
      });
    };

    ssrAndHydrate(App);

    expect(container.innerHTML).toBe("<div>before <span>inner</span> after</div>");
  });

  test("attaches listeners in nested elements", () => {
    const outerHandler = vi.fn();
    const innerHandler = vi.fn();

    const App: Component = () =>
      div(() => [
        on("click", outerHandler),
        button(() => [on("click", innerHandler), text("Click")]),
      ]);

    ssrAndHydrate(App);

    // Click inner button
    const btn = container.querySelector("button")!;
    btn.click();
    expect(innerHandler).toHaveBeenCalledOnce();

    // Click outer div
    container.querySelector("div")!.click();
    expect(outerHandler).toHaveBeenCalled();
  });

  test("returns Slot from yield* and refresh works after hydration", () => {
    let slot: Slot | undefined;

    const App: Component = function* () {
      slot = yield* div(function* () {
        yield* text("initial");
      });
    };

    ssrAndHydrate(App);
    expect(container.innerHTML).toBe("<div>initial</div>");

    // After hydration, Slot.refresh should work with normal rendering
    slot!.refresh(function* () {
      yield* text("updated");
    });
    expect(container.querySelector("div")!.innerHTML).toBe("updated");
  });

  test("runs onMount callbacks", () => {
    const mountFn = vi.fn();

    const App: Component = () => div(() => [onMount(mountFn), text("content")]);

    ssrAndHydrate(App);

    // Mount callbacks are scheduled via scheduleCallback (requestAnimationFrame)
    vi.advanceTimersByTime(16);
    expect(mountFn).toHaveBeenCalledOnce();
  });

  test("dispose completes without error", () => {
    const App: Component = () => div(() => [onMount(() => {}), text("content")]);

    const handle = ssrAndHydrate(App);
    vi.advanceTimersByTime(16);

    // dispose should not throw
    expect(() => handle.dispose()).not.toThrow();
  });

  test("multiple top-level elements", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const App: Component = function* () {
      yield* p(() => [on("click", handler1), text("A")]);
      yield* p(() => [on("click", handler2), text("B")]);
    };

    ssrAndHydrate(App);

    expect(container.innerHTML).toBe("<p>A</p><p>B</p>");

    const paragraphs = container.querySelectorAll("p");
    paragraphs[0].click();
    expect(handler1).toHaveBeenCalledOnce();
    paragraphs[1].click();
    expect(handler2).toHaveBeenCalledOnce();
  });

  describe("mismatch warnings", () => {
    test("warns when element tag does not match", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // SSR renders a <span>, but hydration expects a <div>
      container.innerHTML = "<span>Hello</span>";
      const App: Component = () => div(() => [text("Hello")]);
      hydrate(App, container);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("expected <div> but found <span>"),
      );
      warnSpy.mockRestore();
    });

    test("warns when element node is missing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // SSR renders nothing, but hydration expects a <div>
      container.innerHTML = "";
      const App: Component = () => div(() => [text("Hello")]);
      hydrate(App, container);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("expected <div> but no more children"),
      );
      warnSpy.mockRestore();
    });

    test("warns when text node is missing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // SSR renders <div> with no children, but hydration expects text inside
      container.innerHTML = "<div></div>";
      const App: Component = () => div(() => [text("Hello")]);
      hydrate(App, container);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("expected a text node but no more children"),
      );
      warnSpy.mockRestore();
    });

    test("warns when text node position has an element instead", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // SSR renders <div><span></span></div>, but hydration expects text first
      container.innerHTML = "<div><span></span></div>";
      const App: Component = function* () {
        yield* div(function* () {
          yield* text("Hello");
          yield* span(() => []);
        });
      };
      hydrate(App, container);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("expected a text node but found"),
      );
      warnSpy.mockRestore();
    });
  });
});
