import { describe, it, expect } from "vitest";
import { isTagged, toChildren } from "../utils";
import type { Instruction, Tagged } from "../types";

// テスト用の型定義
type TestText = Tagged<"text", { content: string }>;
type TestAttribute = Tagged<"attribute", { key: string; value: string }>;

describe("isTagged", () => {
  it("returns true when type matches the tag", () => {
    const value: TestText = { type: "text", content: "hello" };
    expect(isTagged(value, "text")).toBe(true);
  });

  it("returns false when type does not match the tag", () => {
    const value: TestText = { type: "text", content: "hello" };
    expect(isTagged(value, "attribute")).toBe(false);
  });

  it("works with various tagged types", () => {
    const attribute: TestAttribute = {
      type: "attribute",
      key: "class",
      value: "container",
    };
    const listener = {
      type: "listener",
      key: "click",
      value: () => {},
    } as const;
    const element = {
      type: "element",
      tag: "div",
      children: [][Symbol.iterator](),
    } as const;

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
    const items: TestText[] = [
      { type: "text", content: "hello" },
      { type: "text", content: "world" },
    ];
    // Create a proper iterator that matches the Instructor type signature
    // Note: In actual usage, Child type is extended by plugins (e.g., @ydant/base)
    const iterator = (function* () {
      for (const item of items) {
        yield item;
      }
    })() as unknown as Iterator<never, void, void>;

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

    const result = toChildren([gen1(), gen2()] as Instruction[]);
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

    const result = toChildren([gen()] as Instruction[]);
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
