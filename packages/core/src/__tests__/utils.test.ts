import { describe, it, expect } from "vitest";
import { isTagged, toChildren } from "../utils";
import type { Text, Children, ChildGen } from "../types";

describe("isTagged", () => {
  it("returns true when type matches the tag", () => {
    const value = { type: "text", content: "hello" } as const;
    expect(isTagged(value, "text")).toBe(true);
  });

  it("returns false when type does not match the tag", () => {
    const value = { type: "text", content: "hello" } as const;
    expect(isTagged(value, "attribute")).toBe(false);
  });

  it("works with various tagged types", () => {
    const attribute = { type: "attribute", key: "class", value: "container" } as const;
    const listener = { type: "listener", key: "click", value: () => {} } as const;
    const element = { type: "element", tag: "div", children: [][Symbol.iterator]() } as const;

    expect(isTagged(attribute, "attribute")).toBe(true);
    expect(isTagged(listener, "listener")).toBe(true);
    expect(isTagged(element, "element")).toBe(true);

    expect(isTagged(attribute, "listener")).toBe(false);
    expect(isTagged(listener, "element")).toBe(false);
    expect(isTagged(element, "text")).toBe(false);
  });
});

describe("toChildren", () => {
  it("returns iterator as-is when passed an iterator", () => {
    const items: Text[] = [
      { type: "text", content: "hello" },
      { type: "text", content: "world" },
    ];
    // Create a proper iterator that matches the Children type signature
    const iterator = (function* () {
      for (const item of items) {
        yield item;
      }
    })() as Children;

    const result = toChildren(iterator);
    expect(result).toBe(iterator);
  });

  it("converts array of generators to a single iterator", () => {
    function* gen1() {
      yield { type: "text", content: "hello" } as const;
    }
    function* gen2() {
      yield { type: "text", content: "world" } as const;
    }

    const result = toChildren([gen1(), gen2()] as ChildGen[]);
    const items: unknown[] = [];
    let next = result.next();
    while (!next.done) {
      items.push(next.value);
      next = result.next();
    }

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ type: "text", content: "hello" });
    expect(items[1]).toEqual({ type: "text", content: "world" });
  });

  it("handles empty array", () => {
    const result = toChildren([]);
    const items: unknown[] = [];
    let next = result.next();
    while (!next.done) {
      items.push(next.value);
      next = result.next();
    }

    expect(items).toHaveLength(0);
  });

  it("handles generators that yield multiple values", () => {
    function* gen() {
      yield { type: "text", content: "a" } as const;
      yield { type: "text", content: "b" } as const;
    }

    const result = toChildren([gen()] as ChildGen[]);
    const items: unknown[] = [];
    let next = result.next();
    while (!next.done) {
      items.push(next.value);
      next = result.next();
    }

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ type: "text", content: "a" });
    expect(items[1]).toEqual({ type: "text", content: "b" });
  });
});
