import { describe, it, expect, vi, beforeEach } from "vitest";
import { div, ul, li, button } from "@ydant/core";
import { text, attr, on, key, onMount, onUnmount, clss } from "@ydant/core";
import type { Slot } from "@ydant/core";
import { mount } from "../index";

describe("keyed elements", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  describe("DOM node reuse", () => {
    it("reuses DOM node with same key on refresh", () => {
      let slot: Slot;
      let items = [{ id: 1, text: "Item 1" }];

      const renderList = function* () {
        for (const item of items) {
          yield* key(item.id);
          yield* li(() => [text(item.text)]);
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      const originalNode = container.querySelector("li");
      expect(originalNode).not.toBeNull();

      // Refresh with same key but different text
      items = [{ id: 1, text: "Updated Item 1" }];
      slot!.refresh(renderList);

      const updatedNode = container.querySelector("li");
      // Same DOM node reference
      expect(updatedNode).toBe(originalNode);
      // Content is updated
      expect(updatedNode?.textContent).toBe("Updated Item 1");
    });

    it("creates new DOM node for new key", () => {
      let slot: Slot;
      let items = [{ id: 1, text: "Item 1" }];

      const renderList = function* () {
        for (const item of items) {
          yield* key(item.id);
          yield* li(() => [text(item.text)]);
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      const originalNode = container.querySelector("li");

      // Refresh with different key
      items = [{ id: 2, text: "Item 2" }];
      slot!.refresh(renderList);

      const newNode = container.querySelector("li");
      // Different DOM node reference
      expect(newNode).not.toBe(originalNode);
      expect(newNode?.textContent).toBe("Item 2");
    });

    it("reorders DOM nodes correctly with keys", () => {
      let slot: Slot;
      let items = [
        { id: 1, text: "First" },
        { id: 2, text: "Second" },
        { id: 3, text: "Third" },
      ];

      const renderList = function* () {
        for (const item of items) {
          yield* key(item.id);
          yield* li(() => [attr("data-id", String(item.id)), text(item.text)]);
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      const [node1, node2, node3] = Array.from(container.querySelectorAll("li"));

      // Reverse order
      items = [
        { id: 3, text: "Third" },
        { id: 2, text: "Second" },
        { id: 1, text: "First" },
      ];
      slot!.refresh(renderList);

      const reorderedNodes = Array.from(container.querySelectorAll("li"));
      // Same nodes, different order
      expect(reorderedNodes[0]).toBe(node3);
      expect(reorderedNodes[1]).toBe(node2);
      expect(reorderedNodes[2]).toBe(node1);
    });
  });

  describe("event listeners on reused elements", () => {
    it("preserves original event listeners on reused keyed elements", () => {
      // This test documents current behavior: listeners are NOT re-added on reuse
      let clickCount = 0;
      let slot: Slot;

      const renderItem = function* () {
        yield* key("item-1");
        yield* button(function* () {
          yield* on("click", () => clickCount++);
          yield* text("Click me");
        });
      };

      mount(
        () =>
          div(function* () {
            slot = yield* div(renderItem);
          }),
        container,
      );

      const btn = container.querySelector("button") as HTMLButtonElement;
      btn.click();
      expect(clickCount).toBe(1);

      // Refresh - same key means node is reused
      slot!.refresh(renderItem);

      // Click again - original listener is still attached
      const btnAfterRefresh = container.querySelector("button") as HTMLButtonElement;
      expect(btnAfterRefresh).toBe(btn); // Same DOM node
      btnAfterRefresh.click();
      expect(clickCount).toBe(2);
    });

    it("does not add duplicate listeners on reused keyed elements", () => {
      // This is the key behavior: when a keyed element is reused,
      // the NEW listeners are NOT added (only the old ones remain)
      let clickCount = 0;
      let slot: Slot;

      const renderItem = function* () {
        yield* key("item-1");
        yield* button(function* () {
          yield* on("click", () => clickCount++);
          yield* text("Click me");
        });
      };

      mount(
        () =>
          div(function* () {
            slot = yield* div(renderItem);
          }),
        container,
      );

      // Refresh multiple times
      slot!.refresh(renderItem);
      slot!.refresh(renderItem);
      slot!.refresh(renderItem);

      const btn = container.querySelector("button") as HTMLButtonElement;
      btn.click();
      // Should only fire once (no duplicate listeners)
      expect(clickCount).toBe(1);
    });

    it("creates fresh listeners for new keyed elements", () => {
      let clickCounts = { a: 0, b: 0 };
      let slot: Slot;
      let currentKey = "a";

      const renderItem = function* () {
        yield* key(currentKey);
        yield* button(function* () {
          yield* on("click", () => clickCounts[currentKey as "a" | "b"]++);
          yield* text(`Button ${currentKey}`);
        });
      };

      mount(
        () =>
          div(function* () {
            slot = yield* div(renderItem);
          }),
        container,
      );

      (container.querySelector("button") as HTMLButtonElement).click();
      expect(clickCounts.a).toBe(1);

      // Change to different key - should create new element with new listener
      currentKey = "b";
      slot!.refresh(renderItem);

      (container.querySelector("button") as HTMLButtonElement).click();
      expect(clickCounts.a).toBe(1); // Unchanged
      expect(clickCounts.b).toBe(1); // New listener fired
    });
  });

  describe("attributes on reused elements", () => {
    it("updates attributes on reused keyed elements", () => {
      let slot: Slot;
      let items = [{ id: 1, className: "initial" }];

      const renderList = function* () {
        for (const item of items) {
          yield* key(item.id);
          yield* li(() => [clss([item.className]), text("Item")]);
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      const node = container.querySelector("li");
      expect(node?.classList.contains("initial")).toBe(true);

      // Update with new class
      items = [{ id: 1, className: "updated" }];
      slot!.refresh(renderList);

      const updatedNode = container.querySelector("li");
      expect(updatedNode).toBe(node); // Same node
      // New class is added (attributes are always applied)
      expect(updatedNode?.classList.contains("updated")).toBe(true);
    });

    it("adds new attributes to reused keyed elements", () => {
      let slot: Slot;
      let addDataAttr = false;

      const renderItem = function* () {
        yield* key("item");
        yield* li(function* () {
          if (addDataAttr) {
            yield* attr("data-new", "value");
          }
          yield* text("Item");
        });
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderItem);
          }),
        container,
      );

      const node = container.querySelector("li");
      expect(node?.hasAttribute("data-new")).toBe(false);

      // Add new attribute
      addDataAttr = true;
      slot!.refresh(renderItem);

      const updatedNode = container.querySelector("li");
      expect(updatedNode).toBe(node); // Same node
      expect(updatedNode?.getAttribute("data-new")).toBe("value");
    });
  });

  describe("lifecycle callbacks with keyed elements", () => {
    it("calls onMount for new keyed elements", () => {
      const mountedIds: number[] = [];
      let slot: Slot;
      let items = [1, 2];

      const renderList = function* () {
        for (const id of items) {
          yield* key(id);
          yield* li(function* () {
            yield* onMount(() => {
              mountedIds.push(id);
            });
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
      expect(mountedIds).toEqual([1, 2]);

      // Add new item
      items = [1, 2, 3];
      slot!.refresh(renderList);

      vi.advanceTimersToNextFrame();
      // Only item 3 should have mounted (1 and 2 are reused)
      expect(mountedIds).toEqual([1, 2, 3]);
    });

    it("calls onUnmount for removed keyed elements", () => {
      const unmountedIds: number[] = [];
      let slot: Slot;
      let items = [1, 2, 3];

      const renderList = function* () {
        for (const id of items) {
          yield* key(id);
          yield* li(function* () {
            yield* onUnmount(() => {
              unmountedIds.push(id);
            });
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

      // Remove middle item
      items = [1, 3];
      slot!.refresh(renderList);

      expect(unmountedIds).toContain(2);
      // Items 1 and 3 should NOT be in unmountedIds (they were reused)
      expect(unmountedIds).not.toContain(1);
      expect(unmountedIds).not.toContain(3);
    });

    it("calls cleanup from onMount when keyed element is removed", () => {
      const events: string[] = [];
      let slot: Slot;
      let items = [1];

      const renderList = function* () {
        for (const id of items) {
          yield* key(id);
          yield* li(function* () {
            yield* onMount(() => {
              events.push(`mount:${id}`);
              return () => events.push(`cleanup:${id}`);
            });
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
      expect(events).toEqual(["mount:1"]);

      // Remove the item
      items = [];
      slot!.refresh(renderList);

      expect(events).toContain("cleanup:1");
    });
  });

  describe("mixed keyed and non-keyed elements", () => {
    it("handles mix of keyed and non-keyed elements", () => {
      let slot: Slot;
      let items = [{ id: 1, text: "Keyed" }];

      const renderList = function* () {
        yield* li(() => [text("Non-keyed header")]);

        for (const item of items) {
          yield* key(item.id);
          yield* li(() => [attr("data-keyed", "true"), text(item.text)]);
        }

        yield* li(() => [text("Non-keyed footer")]);
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      expect(container.querySelectorAll("li")).toHaveLength(3);

      const keyedNode = container.querySelector("[data-keyed]");

      // Refresh with updated keyed item
      items = [{ id: 1, text: "Updated Keyed" }];
      slot!.refresh(renderList);

      // Keyed node should be reused
      expect(container.querySelector("[data-keyed]")).toBe(keyedNode);
      expect(keyedNode?.textContent).toBe("Updated Keyed");
    });
  });

  describe("edge cases", () => {
    it("handles same key used in different refreshes", () => {
      let slot: Slot;
      let items = [{ id: "a", text: "First A" }];

      const renderList = function* () {
        for (const item of items) {
          yield* key(item.id);
          yield* li(() => [text(item.text)]);
        }
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderList);
          }),
        container,
      );

      const nodeA = container.querySelector("li");

      // Replace with different key
      items = [{ id: "b", text: "B" }];
      slot!.refresh(renderList);

      const nodeB = container.querySelector("li");
      expect(nodeB).not.toBe(nodeA);

      // Bring back key 'a'
      items = [{ id: "a", text: "New A" }];
      slot!.refresh(renderList);

      const newNodeA = container.querySelector("li");
      // This should be a NEW node (the old 'a' was discarded)
      expect(newNodeA).not.toBe(nodeA);
      expect(newNodeA?.textContent).toBe("New A");
    });

    it("handles rapid successive refreshes", () => {
      let slot: Slot;
      let counter = 0;

      const renderItem = function* () {
        yield* key("item");
        yield* div(() => [text(`Count: ${counter}`)]);
      };

      mount(
        () =>
          div(function* () {
            slot = yield* div(renderItem);
          }),
        container,
      );

      const node = container.querySelector("div > div");

      // Rapid refreshes
      for (let i = 1; i <= 10; i++) {
        counter = i;
        slot!.refresh(renderItem);
      }

      const afterRefresh = container.querySelector("div > div");
      expect(afterRefresh).toBe(node); // Same node
      expect(afterRefresh?.textContent).toBe("Count: 10");
    });

    it("handles numeric and string keys that look similar", () => {
      let slot: Slot;
      let useStringKey = false;

      const renderItem = function* () {
        // Numeric key 1 vs string key "1"
        yield* key(useStringKey ? "1" : 1);
        yield* li(() => [text(useStringKey ? "String" : "Number")]);
      };

      mount(
        () =>
          div(function* () {
            slot = yield* ul(renderItem);
          }),
        container,
      );

      const originalNode = container.querySelector("li");
      expect(originalNode?.textContent).toBe("Number");

      // Switch to string key
      useStringKey = true;
      slot!.refresh(renderItem);

      const newNode = container.querySelector("li");
      // Different key type means different key, so new node
      expect(newNode).not.toBe(originalNode);
      expect(newNode?.textContent).toBe("String");
    });
  });
});
