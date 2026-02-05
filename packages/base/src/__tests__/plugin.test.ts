import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@ydant/core";
import { createBasePlugin } from "../plugin";
import { div, span, button } from "../elements/html";
import { attr, on, text, key, onMount, onUnmount } from "../primitives";
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
      expect(plugin.types).toEqual([
        "element",
        "text",
        "attribute",
        "listener",
        "key",
        "lifecycle",
      ]);
    });
  });

  describe("processText", () => {
    it("creates text node and appends to parent", () => {
      mount(() => div(() => [text("Hello, World!")]), container, {
        plugins: [createBasePlugin()],
      });

      const divEl = container.querySelector("div");
      expect(divEl?.textContent).toBe("Hello, World!");
    });

    it("handles empty text", () => {
      mount(() => div(() => [text("")]), container, {
        plugins: [createBasePlugin()],
      });

      const divEl = container.querySelector("div");
      expect(divEl?.textContent).toBe("");
    });

    it("handles special characters", () => {
      mount(() => div(() => [text('<script>alert("xss")</script>')]), container, {
        plugins: [createBasePlugin()],
      });

      const divEl = container.querySelector("div");
      expect(divEl?.textContent).toBe('<script>alert("xss")</script>');
      // XSS should not execute - text is escaped
      expect(divEl?.querySelector("script")).toBeNull();
    });
  });

  describe("processAttribute", () => {
    it("sets attribute on element", () => {
      mount(() => div(() => [attr("id", "my-div"), attr("data-test", "value")]), container, {
        plugins: [createBasePlugin()],
      });

      const divEl = container.querySelector("div");
      expect(divEl?.getAttribute("id")).toBe("my-div");
      expect(divEl?.getAttribute("data-test")).toBe("value");
    });

    it("handles class attribute", () => {
      mount(() => div(() => [attr("class", "container flex")]), container, {
        plugins: [createBasePlugin()],
      });

      const divEl = container.querySelector("div");
      expect(divEl?.getAttribute("class")).toBe("container flex");
    });
  });

  describe("processListener", () => {
    it("adds event listener to element", () => {
      const handler = vi.fn();

      mount(() => button(() => [on("click", handler), text("Click me")]), container, {
        plugins: [createBasePlugin()],
      });

      const btn = container.querySelector("button");
      btn?.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("receives event object", () => {
      const handler = vi.fn();

      mount(() => button(() => [on("click", handler)]), container, {
        plugins: [createBasePlugin()],
      });

      const btn = container.querySelector("button");
      btn?.click();

      expect(handler).toHaveBeenCalledWith(expect.any(Event));
    });
  });

  describe("processLifecycle", () => {
    it("calls onMount callback after DOM insertion", () => {
      const mountCallback = vi.fn();

      mount(
        () =>
          div(() => [
            onMount(() => {
              mountCallback();
            }),
          ]),
        container,
        { plugins: [createBasePlugin()] },
      );

      // onMount is called in requestAnimationFrame
      expect(mountCallback).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(mountCallback).toHaveBeenCalledTimes(1);
    });

    it("calls onMount with DOM ready", () => {
      let domReady = false;

      mount(
        () =>
          div(() => [
            attr("id", "test-element"),
            onMount(() => {
              // DOM should be ready when onMount is called
              domReady = document.getElementById("test-element") !== null;
            }),
          ]),
        container,
        { plugins: [createBasePlugin()] },
      );

      vi.runAllTimers();

      expect(domReady).toBe(true);
    });

    it("registers onUnmount callback", () => {
      const unmountCallback = vi.fn();

      mount(
        () =>
          div(() => [
            onUnmount(() => {
              unmountCallback();
            }),
          ]),
        container,
        { plugins: [createBasePlugin()] },
      );

      vi.runAllTimers();

      // onUnmount is registered but not called until element is removed
      // The callback is stored in the context's unmountCallbacks
      expect(unmountCallback).not.toHaveBeenCalled();
    });
  });

  describe("processKey", () => {
    it("sets pendingKey via key primitive", () => {
      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => [key("my-key"), text("Content")]);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      expect(slot?.node).toBeDefined();
      expect(slot?.node.textContent).toBe("Content");
    });

    it("allows numeric keys", () => {
      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => [key(42), text("Numeric key")]);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      expect(slot?.node).toBeDefined();
      expect(slot?.node.textContent).toBe("Numeric key");
    });

    it("allows zero as key", () => {
      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => [key(0), text("Zero key")]);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      expect(slot?.node).toBeDefined();
      expect(slot?.node.textContent).toBe("Zero key");
    });
  });

  describe("processElement", () => {
    it("creates HTML element", () => {
      mount(() => div(() => [text("Content")]), container, {
        plugins: [createBasePlugin()],
      });

      const divEl = container.querySelector("div");
      expect(divEl).not.toBeNull();
      expect(divEl?.tagName).toBe("DIV");
    });

    it("nests elements correctly", () => {
      mount(
        () => div(() => [span(() => [text("Child 1")]), span(() => [text("Child 2")])]),
        container,
        { plugins: [createBasePlugin()] },
      );

      const divEl = container.querySelector("div");
      const spans = divEl?.querySelectorAll("span");

      expect(spans?.length).toBe(2);
      expect(spans?.[0].textContent).toBe("Child 1");
      expect(spans?.[1].textContent).toBe("Child 2");
    });

    it("returns Slot from element", () => {
      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* span(() => [text("Content")]);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      expect(slot).toBeDefined();
      expect(slot?.node).toBeInstanceOf(HTMLElement);
      expect(slot?.node.tagName).toBe("SPAN");
      expect(typeof slot?.refresh).toBe("function");
    });
  });

  describe("Slot.refresh", () => {
    it("clears and rebuilds children", () => {
      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => [text("Original")]);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      expect(slot?.node.textContent).toBe("Original");

      slot?.refresh(() => [text("Updated"), text(" Content")]);

      expect(slot?.node.textContent).toBe("Updated Content");
    });

    it("handles nested elements on refresh", () => {
      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => [span(() => [text("Child")])]);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      expect(slot?.node.querySelector("span")?.textContent).toBe("Child");

      slot?.refresh(() => [span(() => [text("New Child 1")]), span(() => [text("New Child 2")])]);

      const spans = slot?.node.querySelectorAll("span");
      expect(spans?.length).toBe(2);
      expect(spans?.[0].textContent).toBe("New Child 1");
      expect(spans?.[1].textContent).toBe("New Child 2");
    });

    it("clears all children on refresh with empty builder", () => {
      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => [span(() => [text("Child 1")]), span(() => [text("Child 2")])]);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      expect(slot?.node.querySelectorAll("span").length).toBe(2);

      slot?.refresh(() => []);

      expect(slot?.node.querySelectorAll("span").length).toBe(0);
      expect(slot?.node.textContent).toBe("");
    });

    it("executes mount callbacks after refresh", () => {
      const mountCallback = vi.fn();

      let slot: Slot | undefined;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => []);
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      vi.runAllTimers();

      slot?.refresh(() => [
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

      mount(
        () =>
          div(function* () {
            slot = yield* div(function* () {
              yield* button(() => [key("btn"), on("click", handler), text("Click")]);
            });
          }),
        container,
        { plugins: [createBasePlugin()] },
      );

      // Refresh to trigger element reuse
      slot?.refresh(function* () {
        yield* button(() => [key("btn"), on("click", handler), text("Click Again")]);
      });

      const btn = container.querySelector("button");
      btn?.click();

      // Handler should only be called once (not duplicated)
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("multiple elements", () => {
    it("handles multiple sibling elements", () => {
      mount(
        () =>
          div(() => [
            span(() => [text("First")]),
            span(() => [text("Second")]),
            span(() => [text("Third")]),
          ]),
        container,
        { plugins: [createBasePlugin()] },
      );

      const spans = container.querySelectorAll("span");
      expect(spans.length).toBe(3);
      expect(spans[0].textContent).toBe("First");
      expect(spans[1].textContent).toBe("Second");
      expect(spans[2].textContent).toBe("Third");
    });

    it("handles multiple levels of nesting", () => {
      mount(() => div(() => [div(() => [div(() => [text("Deep")])])]), container, {
        plugins: [createBasePlugin()],
      });

      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
      expect(divs[2].textContent).toBe("Deep");
    });
  });
});
