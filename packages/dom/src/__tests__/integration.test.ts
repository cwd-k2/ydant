import { describe, it, expect, vi, beforeEach } from "vitest";
import { div, p, button, ul, li } from "@ydant/core";
import { text, attr, on, key, onUnmount } from "@ydant/core";
import type { Component, Slot } from "@ydant/core";
import { mount } from "../index";
import type { DomPlugin, PluginAPI } from "../plugin";

describe("integration", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("mount", () => {
    it("mounts component to DOM", () => {
      const App: Component = () => div(() => [p(() => [text("Hello World")])]);

      mount(App, container);

      expect(container.children).toHaveLength(1);
      expect(container.children[0].tagName).toBe("DIV");
      expect(container.querySelector("p")?.textContent).toBe("Hello World");
    });

    it("clears container before mounting", () => {
      container.innerHTML = "<p>Old content</p>";

      mount(() => div(() => [text("New")]), container);

      expect(container.children).toHaveLength(1);
      expect(container.textContent).toBe("New");
    });
  });

  describe("nested components", () => {
    it("renders nested component functions", () => {
      function Header() {
        return div(function* () {
          yield* attr("class", "header");
          yield* text("Header");
        });
      }

      function Footer() {
        return div(function* () {
          yield* attr("class", "footer");
          yield* text("Footer");
        });
      }

      const App: Component = () =>
        div(function* () {
          yield* Header();
          yield* p(() => [text("Content")]);
          yield* Footer();
        });

      mount(App, container);

      const root = container.children[0];
      expect(root.children).toHaveLength(3);
      expect(root.children[0].className).toBe("header");
      expect(root.children[1].tagName).toBe("P");
      expect(root.children[2].className).toBe("footer");
    });
  });

  describe("Slot.refresh()", () => {
    it("re-renders element content", () => {
      let count = 0;
      let slot: Slot;

      const App: Component = () =>
        div(function* () {
          slot = yield* p(function* () {
            yield* text(`Count: ${count}`);
          });

          yield* button(function* () {
            yield* on("click", () => {
              count++;
              slot.refresh(() => [text(`Count: ${count}`)]);
            });
            yield* text("Increment");
          });
        });

      mount(App, container);

      expect(container.querySelector("p")?.textContent).toBe("Count: 0");

      (container.querySelector("button") as HTMLButtonElement).click();
      expect(container.querySelector("p")?.textContent).toBe("Count: 1");

      (container.querySelector("button") as HTMLButtonElement).click();
      expect(container.querySelector("p")?.textContent).toBe("Count: 2");
    });
  });

  describe("keyed elements", () => {
    it("reuses DOM nodes with same key on refresh", () => {
      let slot!: Slot;
      let items = [
        { id: 1, text: "Item 1" },
        { id: 2, text: "Item 2" },
        { id: 3, text: "Item 3" },
      ];

      const renderList = function* () {
        for (const item of items) {
          yield* key(item.id);
          yield* li(() => [text(item.text)]);
        }
      };

      const App: Component = () =>
        div(function* () {
          slot = yield* ul(renderList);
        });

      mount(App, container);

      const list = container.querySelector("ul")!;
      expect(list.children).toHaveLength(3);

      // Save references to original nodes
      const originalNode1 = list.children[0];
      const originalNode2 = list.children[1];
      const originalNode3 = list.children[2];

      // Reorder items
      items = [
        { id: 3, text: "Item 3 updated" },
        { id: 1, text: "Item 1 updated" },
        { id: 2, text: "Item 2 updated" },
      ];
      slot.refresh(renderList);

      // Nodes should be reused (same DOM reference)
      expect(list.children[0]).toBe(originalNode3);
      expect(list.children[1]).toBe(originalNode1);
      expect(list.children[2]).toBe(originalNode2);

      // Content should be updated
      expect(list.children[0].textContent).toBe("Item 3 updated");
      expect(list.children[1].textContent).toBe("Item 1 updated");
      expect(list.children[2].textContent).toBe("Item 2 updated");
    });
  });

  describe("plugin integration", () => {
    it("registers and uses plugins", () => {
      const customPlugin: DomPlugin = {
        name: "custom",
        types: ["custom-element"],
        process(child, api: PluginAPI) {
          const data = (child as any).content;
          const textNode = document.createTextNode(`[Custom: ${data}]`);
          api.appendChild(textNode);
          return {};
        },
      };

      mount(
        () =>
          div(function* () {
            yield* text("Before ");
            yield { type: "custom-element", content: "Hello" } as any;
            yield* text(" After");
          }),
        container,
        { plugins: [customPlugin] },
      );

      expect(container.children[0].textContent).toBe("Before [Custom: Hello] After");
    });

    it("plugin can access PluginAPI methods", () => {
      vi.useFakeTimers();

      const mountCalls: string[] = [];
      const unmountCalls: string[] = [];

      const lifecyclePlugin: DomPlugin = {
        name: "lifecycle-test",
        types: ["lifecycle-test"],
        process(_child, api: PluginAPI) {
          api.onMount(() => {
            mountCalls.push("mounted");
            return () => unmountCalls.push("cleanup from mount");
          });
          api.onUnmount(() => unmountCalls.push("unmounted"));
          return {};
        },
      };

      let slot!: Slot;

      mount(
        () =>
          div(function* () {
            slot = yield* p(function* () {
              yield { type: "lifecycle-test" } as any;
              yield* text("Content");
            });
          }),
        container,
        { plugins: [lifecyclePlugin] },
      );

      vi.advanceTimersToNextFrame();
      expect(mountCalls).toEqual(["mounted"]);
      expect(unmountCalls).toEqual([]);

      slot.refresh(() => [text("New")]);
      // The order depends on internal implementation:
      // - onUnmount callbacks are stored first, then cleanup from onMount
      // Current implementation runs them in order they were added
      expect(unmountCalls).toEqual(["unmounted", "cleanup from mount"]);
    });
  });

  describe("PluginAPI extended methods", () => {
    it("provides parent and currentElement in PluginAPI", () => {
      let capturedParent: Node | null = null;
      let capturedCurrentElement: globalThis.Element | null = null;

      const inspectorPlugin: DomPlugin = {
        name: "inspector",
        types: ["inspector"],
        process(_child, api: PluginAPI) {
          capturedParent = api.parent;
          capturedCurrentElement = api.currentElement;
          return {};
        },
      };

      mount(
        () =>
          div(function* () {
            yield* attr("id", "parent-element");
            yield { type: "inspector" } as any;
          }),
        container,
        { plugins: [inspectorPlugin] },
      );

      expect(capturedParent).not.toBeNull();
      expect(capturedParent!.nodeName).toBe("DIV");
      expect(capturedCurrentElement).not.toBeNull();
      expect(capturedCurrentElement!.id).toBe("parent-element");
    });

    it("plugin can use processChildren to render nested content", () => {
      const wrapperPlugin: DomPlugin = {
        name: "wrapper",
        types: ["wrapper"],
        process(child, api: PluginAPI) {
          const wrapper = document.createElement("section");
          wrapper.setAttribute("class", "wrapper");
          api.appendChild(wrapper);

          // Use processChildren to render the nested content
          const builder = (child as any).children;
          if (builder) {
            api.processChildren(builder, { parent: wrapper });
          }

          return {};
        },
      };

      mount(
        () =>
          div(function* () {
            yield {
              type: "wrapper",
              children: () => [text("Nested content")],
            } as any;
          }),
        container,
        { plugins: [wrapperPlugin] },
      );

      const wrapper = container.querySelector(".wrapper");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.textContent).toBe("Nested content");
    });

    it("plugin can use createChildAPI for nested rendering", () => {
      const nestedPlugin: DomPlugin = {
        name: "nested",
        types: ["nested-container"],
        process(child, api: PluginAPI) {
          const wrapper = document.createElement("aside");
          api.appendChild(wrapper);

          // Use createChildAPI for a new context
          const childApi = api.createChildAPI(wrapper);
          const childNode = document.createTextNode("Child content");
          childApi.appendChild(childNode);

          return {};
        },
      };

      mount(
        () =>
          div(function* () {
            yield { type: "nested-container" } as any;
          }),
        container,
        { plugins: [nestedPlugin] },
      );

      const aside = container.querySelector("aside");
      expect(aside).not.toBeNull();
      expect(aside?.textContent).toBe("Child content");
    });

    it("plugin context and getContext/setContext work correctly", () => {
      const contextSymbol = Symbol("test-context");
      let retrievedValue: string | undefined;

      const setterPlugin: DomPlugin = {
        name: "setter",
        types: ["context-setter"],
        process(child, api: PluginAPI) {
          api.setContext(contextSymbol, (child as any).value);
          return {};
        },
      };

      const getterPlugin: DomPlugin = {
        name: "getter",
        types: ["context-getter"],
        process(_child, api: PluginAPI) {
          retrievedValue = api.getContext<string>(contextSymbol);
          return {};
        },
      };

      mount(
        () =>
          div(function* () {
            yield { type: "context-setter", value: "test-value" } as any;
            yield { type: "context-getter" } as any;
          }),
        container,
        { plugins: [setterPlugin, getterPlugin] },
      );

      expect(retrievedValue).toBe("test-value");
    });
  });

  describe("keyed element edge cases", () => {
    it("runs unmount callbacks on removed keyed elements", () => {
      vi.useFakeTimers();
      const unmountedIds: number[] = [];
      let slot!: Slot;
      let items = [1, 2, 3];

      const renderList = function* () {
        for (const id of items) {
          yield* key(id);
          yield* li(function* () {
            yield* onUnmount(() => unmountedIds.push(id));
            yield* text(`Item ${id}`);
          });
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      vi.advanceTimersToNextFrame();
      expect(container.querySelectorAll("li")).toHaveLength(3);
      expect(unmountedIds).toEqual([]);

      // Remove item 2
      items = [1, 3];
      slot.refresh(renderList);

      // Item 2's unmount callback should have been called
      expect(unmountedIds).toContain(2);
      expect(container.querySelectorAll("li")).toHaveLength(2);
      expect(container.querySelectorAll("li")[0].textContent).toBe("Item 1");
      expect(container.querySelectorAll("li")[1].textContent).toBe("Item 3");
    });

    it("reuses keyed element with attributes preserved", () => {
      let slot!: Slot;
      let items = [{ id: "a", label: "Item A" }];

      const renderList = function* () {
        for (const item of items) {
          yield* key(item.id);
          yield* li(function* () {
            yield* attr("data-id", item.id);
            yield* text(item.label);
          });
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      const originalLi = container.querySelector("li");
      expect(originalLi?.getAttribute("data-id")).toBe("a");

      // Refresh with updated content but same key
      items = [{ id: "a", label: "Updated A" }];
      slot.refresh(renderList);

      const updatedLi = container.querySelector("li");
      // Node is reused (same reference)
      expect(updatedLi).toBe(originalLi);
      // Content is updated
      expect(updatedLi?.textContent).toBe("Updated A");
    });
  });

  describe("complex scenarios", () => {
    it("handles conditional rendering", () => {
      let showDetails = false;
      let slot: Slot;

      const renderContent = function* () {
        yield* text("Header");
        if (showDetails) {
          yield* p(() => [text("Details")]);
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* div(renderContent);
          }),
        container,
      );

      expect(container.querySelector("p")).toBeNull();

      showDetails = true;
      slot!.refresh(renderContent);

      expect(container.querySelector("p")?.textContent).toBe("Details");
    });

    it("handles list rendering with dynamic items", () => {
      let items = ["A", "B", "C"];
      let slot: Slot;

      const renderList = function* () {
        for (let i = 0; i < items.length; i++) {
          yield* key(i);
          yield* li(() => [text(items[i])]);
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      expect(container.querySelectorAll("li")).toHaveLength(3);

      items = ["X", "Y"];
      slot!.refresh(renderList);

      expect(container.querySelectorAll("li")).toHaveLength(2);
      expect(container.querySelectorAll("li")[0].textContent).toBe("X");
      expect(container.querySelectorAll("li")[1].textContent).toBe("Y");
    });
  });
});
