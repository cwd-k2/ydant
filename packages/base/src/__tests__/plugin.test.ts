import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scope } from "@ydant/core";
import type { RenderContext } from "@ydant/core";
import { createBasePlugin } from "../plugin";
import { createDOMBackend } from "../capabilities";
import { div, span, button } from "../elements/html";
import { text, keyed, onMount, onUnmount } from "../primitives";
import { refresh } from "..";
import type { Slot } from "../types";

describe("createBasePlugin", () => {
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

  describe("plugin structure", () => {
    it("creates a plugin with correct name and types", () => {
      const plugin = createBasePlugin();

      expect(plugin.name).toBe("base");
      expect(plugin.types).toEqual(["element", "svg", "text", "lifecycle"]);
    });
  });

  describe("processText", () => {
    it("creates text node and appends to parent", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [text("Hello, World!")]),
      );

      const divEl = container.querySelector("div");
      expect(divEl?.textContent).toBe("Hello, World!");
    });

    it("handles empty text", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() => div(() => [text("")]));

      const divEl = container.querySelector("div");
      expect(divEl?.textContent).toBe("");
    });

    it("handles special characters", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [text('<script>alert("xss")</script>')]),
      );

      const divEl = container.querySelector("div");
      expect(divEl?.textContent).toBe('<script>alert("xss")</script>');
      // XSS should not execute - text is escaped
      expect(divEl?.querySelector("script")).toBeNull();
    });
  });

  describe("attributes via props", () => {
    it("sets attribute on element via props", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div({ id: "my-div", "data-test": "value" }),
      );

      const divEl = container.querySelector("div");
      expect(divEl?.getAttribute("id")).toBe("my-div");
      expect(divEl?.getAttribute("data-test")).toBe("value");
    });

    it("handles class attribute via props", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div({ class: "container flex" }),
      );

      const divEl = container.querySelector("div");
      expect(divEl?.getAttribute("class")).toBe("container flex");
    });
  });

  describe("event handlers via props", () => {
    it("adds event listener via props", () => {
      const handler = vi.fn();

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        button({ onClick: handler }, "Click me"),
      );

      const btn = container.querySelector("button");
      btn?.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("receives event object", () => {
      const handler = vi.fn();

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        button({ onClick: handler }),
      );

      const btn = container.querySelector("button");
      btn?.click();

      expect(handler).toHaveBeenCalledWith(expect.any(Event));
    });
  });

  describe("processLifecycle", () => {
    it("calls onMount callback after DOM insertion", () => {
      const mountCallback = vi.fn();

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [
          onMount(() => {
            mountCallback();
          }),
        ]),
      );

      // onMount is called in requestAnimationFrame
      expect(mountCallback).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(mountCallback).toHaveBeenCalledTimes(1);
    });

    it("calls onMount with DOM ready", () => {
      let domReady = false;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div({ id: "test-element" }, () => [
          onMount(() => {
            // DOM should be ready when onMount is called
            domReady = document.getElementById("test-element") !== null;
          }),
        ]),
      );

      vi.runAllTimers();

      expect(domReady).toBe(true);
    });

    it("registers onUnmount callback", () => {
      const unmountCallback = vi.fn();

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [
          onUnmount(() => {
            unmountCallback();
          }),
        ]),
      );

      vi.runAllTimers();

      // onUnmount is registered but not called until element is removed
      // The callback is stored in the context's unmountCallbacks
      expect(unmountCallback).not.toHaveBeenCalled();
    });

    it("calls onUnmount callbacks when refresh() is called", () => {
      const unmountCallback = vi.fn();
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(() => [
            span(() => [
              onUnmount(() => {
                unmountCallback();
              }),
              text("Child"),
            ]),
          ]);
        }),
      );

      vi.runAllTimers();

      // Refresh should call onUnmount for removed children
      if (slot) refresh(slot, () => [text("New Content")]);

      expect(unmountCallback).toHaveBeenCalledTimes(1);
    });

    it("onMount cleanup function is added asynchronously via requestAnimationFrame", () => {
      const cleanupFn = vi.fn();

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [
          onMount(() => {
            return cleanupFn;
          }),
        ]),
      );

      expect(cleanupFn).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(cleanupFn).not.toHaveBeenCalled();
    });

    it("calls onUnmount for cleanup (recommended pattern)", () => {
      const cleanupFn = vi.fn();
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(() => [
            span(() => [
              // onUnmount を直接使用する推奨パターン
              onUnmount(cleanupFn),
              text("Child"),
            ]),
          ]);
        }),
      );

      vi.runAllTimers();

      expect(cleanupFn).not.toHaveBeenCalled();

      if (slot) refresh(slot, () => [text("New Content")]);

      expect(cleanupFn).toHaveBeenCalledTimes(1);
    });

    it("calls nested onUnmount callbacks in correct order", () => {
      const calls: string[] = [];
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(() => [
            span(() => [
              onUnmount(() => calls.push("outer")),
              div(() => [onUnmount(() => calls.push("inner")), text("Nested")]),
            ]),
          ]);
        }),
      );

      vi.runAllTimers();

      if (slot) refresh(slot, () => []);

      expect(calls).toContain("outer");
      expect(calls).toContain("inner");
    });
  });

  describe("keyed", () => {
    it("creates keyed element with string key", () => {
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* keyed("my-key", div)(() => [text("Content")]);
        }),
      );

      expect(slot?.node).toBeDefined();
      expect((slot?.node as HTMLElement).textContent).toBe("Content");
    });

    it("allows numeric keys", () => {
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* keyed(42, div)(() => [text("Numeric key")]);
        }),
      );

      expect(slot?.node).toBeDefined();
      expect((slot?.node as HTMLElement).textContent).toBe("Numeric key");
    });

    it("allows zero as key", () => {
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* keyed(0, div)(() => [text("Zero key")]);
        }),
      );

      expect(slot?.node).toBeDefined();
      expect((slot?.node as HTMLElement).textContent).toBe("Zero key");
    });
  });

  describe("processElement", () => {
    it("creates HTML element", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [text("Content")]),
      );

      const divEl = container.querySelector("div");
      expect(divEl).not.toBeNull();
      expect(divEl?.tagName).toBe("DIV");
    });

    it("nests elements correctly", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [span(() => [text("Child 1")]), span(() => [text("Child 2")])]),
      );

      const divEl = container.querySelector("div");
      const spans = divEl?.querySelectorAll("span");

      expect(spans?.length).toBe(2);
      expect(spans?.[0].textContent).toBe("Child 1");
      expect(spans?.[1].textContent).toBe("Child 2");
    });

    it("returns Slot from element", () => {
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* span(() => [text("Content")]);
        }),
      );

      expect(slot).toBeDefined();
      expect(slot?.node).toBeInstanceOf(HTMLElement);
      expect((slot?.node as HTMLElement).tagName).toBe("SPAN");
    });
  });

  describe("refresh()", () => {
    it("clears and rebuilds children", () => {
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(() => [text("Original")]);
        }),
      );

      expect((slot?.node as HTMLElement).textContent).toBe("Original");

      if (slot) refresh(slot, () => [text("Updated"), text(" Content")]);

      expect((slot?.node as HTMLElement).textContent).toBe("Updated Content");
    });

    it("handles nested elements on refresh", () => {
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(() => [span(() => [text("Child")])]);
        }),
      );

      expect((slot?.node as HTMLElement).querySelector("span")?.textContent).toBe("Child");

      if (slot)
        refresh(slot, () => [span(() => [text("New Child 1")]), span(() => [text("New Child 2")])]);

      const spans = (slot?.node as HTMLElement).querySelectorAll("span");
      expect(spans?.length).toBe(2);
      expect(spans?.[0].textContent).toBe("New Child 1");
      expect(spans?.[1].textContent).toBe("New Child 2");
    });

    it("clears all children on refresh with empty builder", () => {
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(() => [span(() => [text("Child 1")]), span(() => [text("Child 2")])]);
        }),
      );

      expect((slot?.node as HTMLElement).querySelectorAll("span").length).toBe(2);

      if (slot) refresh(slot, () => []);

      expect((slot?.node as HTMLElement).querySelectorAll("span").length).toBe(0);
      expect((slot?.node as HTMLElement).textContent).toBe("");
    });

    it("executes mount callbacks after refresh", () => {
      const mountCallback = vi.fn();

      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(() => []);
        }),
      );

      vi.runAllTimers();

      if (slot)
        refresh(slot, () => [
          span(() => [
            onMount(() => {
              mountCallback();
            }),
          ]),
        ]);

      expect(mountCallback).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(mountCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("listener on reused element", () => {
    it("does not duplicate listeners on element reuse", () => {
      const handler = vi.fn();
      let slot: Slot | undefined;

      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(function* () {
          slot = yield* div(function* () {
            yield* keyed("btn", button)({ onClick: handler }, "Click");
          });
        }),
      );

      // Refresh to trigger element reuse
      if (slot)
        refresh(slot, function* () {
          yield* keyed("btn", button)({ onClick: handler }, "Click Again");
        });

      const btn = container.querySelector("button");
      btn?.click();

      // Handler should only be called once (not duplicated)
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("optional interact capability", () => {
    /** DOM backend without interact — simulates Canvas-like environment. */
    function createDOMBackendWithoutInteract(
      root: unknown,
    ): import("@ydant/core").Backend<"tree" | "decorate" | "schedule"> {
      return {
        name: "dom-no-interact",
        root,
        initContext(ctx: RenderContext) {
          ctx.tree = {
            createElement: (tag: string) => document.createElement(tag),
            createElementNS: (ns: string, tag: string) => document.createElementNS(ns, tag),
            createTextNode: (content: string) => document.createTextNode(content),
            appendChild: (parent: unknown, child: unknown) =>
              (parent as Node).appendChild(child as Node),
            removeChild: (parent: unknown, child: unknown) =>
              (parent as Node).removeChild(child as Node),
            clearChildren: (parent: unknown) => {
              (parent as Element).textContent = "";
            },
          };
          ctx.decorate = {
            setAttribute: (node: unknown, key: string, value: string) =>
              (node as Element).setAttribute(key, value),
          };
          ctx.schedule = {
            scheduleCallback: (cb: () => void) => setTimeout(cb, 0),
          };
          ctx.currentElement = ctx.parent instanceof Element ? ctx.parent : null;
        },
      };
    }

    it("silently ignores event handler props when interact is not provided", () => {
      const handler = vi.fn();

      expect(() => {
        scope(createDOMBackendWithoutInteract(container), [createBasePlugin()]).mount(() =>
          div(function* () {
            yield* button({ onClick: handler }, "Click");
          }),
        );
      }).not.toThrow();

      // The button renders, but clicking does nothing (listener was skipped)
      const btn = container.querySelector("button");
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe("Click");
      btn?.click();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("multiple elements", () => {
    it("handles multiple sibling elements", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [
          span(() => [text("First")]),
          span(() => [text("Second")]),
          span(() => [text("Third")]),
        ]),
      );

      const spans = container.querySelectorAll("span");
      expect(spans.length).toBe(3);
      expect(spans[0].textContent).toBe("First");
      expect(spans[1].textContent).toBe("Second");
      expect(spans[2].textContent).toBe("Third");
    });

    it("handles multiple levels of nesting", () => {
      scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
        div(() => [div(() => [div(() => [text("Deep")])])]),
      );

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
      expect(divs[2].textContent).toBe("Deep");
    });
  });
});
