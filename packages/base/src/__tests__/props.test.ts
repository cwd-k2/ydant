import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scope } from "@ydant/core";
import { createBasePlugin } from "../plugin";
import { createDOMBackend } from "../capabilities";
import { div, button, p, a } from "../elements/html";
import { svg, circle, rect } from "../elements/svg";
import { text, attr, keyed } from "../primitives";
import type { Element, SvgElement, Attribute } from "../types";
import { parseFactoryArgs } from "../elements/props";

// =============================================================================
// parseFactoryArgs unit tests
// =============================================================================

/** Helper to collect all items from an iterator */
function collectIterator<T>(iter: Iterator<T>): T[] {
  const items: T[] = [];
  let next = iter.next();
  while (!next.done) {
    items.push(next.value as T);
    next = iter.next();
  }
  return items;
}

describe("parseFactoryArgs", () => {
  it("handles no arguments (empty element)", () => {
    const result = parseFactoryArgs([]);
    expect(collectIterator(result.children)).toEqual([]);
    expect(result.decorations).toBeUndefined();
    expect(result.key).toBeUndefined();
  });

  it("handles builder function", () => {
    const result = parseFactoryArgs([() => [text("hello")]]);
    const children = collectIterator(result.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: "text", content: "hello" });
  });

  it("handles generator builder function", () => {
    const result = parseFactoryArgs([
      function* () {
        yield* text("hello");
        yield* text("world");
      },
    ]);
    const children = collectIterator(result.children);
    expect(children).toHaveLength(2);
  });

  it("handles text string", () => {
    const result = parseFactoryArgs(["hello"]);
    const children = collectIterator(result.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: "text", content: "hello" });
  });

  it("handles props only", () => {
    const result = parseFactoryArgs([{ classes: ["foo"], id: "bar" }]);
    expect(collectIterator(result.children)).toEqual([]);
    expect(result.decorations).toEqual([
      { type: "attribute", key: "class", value: "foo" },
      { type: "attribute", key: "id", value: "bar" },
    ]);
  });

  it("handles props with text", () => {
    const result = parseFactoryArgs([{ classes: ["foo"] }, "hello"]);
    const children = collectIterator(result.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: "text", content: "hello" });
    expect(result.decorations).toEqual([{ type: "attribute", key: "class", value: "foo" }]);
  });

  it("handles props with builder", () => {
    const result = parseFactoryArgs([{ classes: ["foo"] }, () => [text("hello")]]);
    const children = collectIterator(result.children);
    expect(children).toHaveLength(1);
    expect(result.decorations).toEqual([{ type: "attribute", key: "class", value: "foo" }]);
  });

  describe("props parsing", () => {
    it("extracts key from props", () => {
      const result = parseFactoryArgs([{ key: 42 }]);
      expect(result.key).toBe(42);
      // key should not appear in decorations
      expect(result.decorations).toEqual([]);
    });

    it("converts classes array to string, filtering falsy values", () => {
      const result = parseFactoryArgs([
        { classes: ["a", false, "b", null, "c", undefined, "", 0] },
      ]);
      expect(result.decorations).toEqual([{ type: "attribute", key: "class", value: "a b c" }]);
    });

    it("skips empty classes array", () => {
      const result = parseFactoryArgs([{ classes: [] }]);
      expect(result.decorations).toEqual([]);
    });

    it("converts style object to string", () => {
      const result = parseFactoryArgs([{ style: { padding: "16px", fontSize: "14px" } }]);
      const styleDecoration = result.decorations?.find(
        (d) => d.type === "attribute" && (d as Attribute).key === "style",
      ) as Attribute;
      expect(styleDecoration.value).toBe("padding: 16px; font-size: 14px");
    });

    it("handles CSS custom properties in style", () => {
      const result = parseFactoryArgs([{ style: { "--primary": "#333" } }]);
      const styleDecoration = result.decorations?.find(
        (d) => d.type === "attribute" && (d as Attribute).key === "style",
      ) as Attribute;
      expect(styleDecoration.value).toBe("--primary: #333");
    });

    it("passes style string through", () => {
      const result = parseFactoryArgs([{ style: "color: red" }]);
      expect(result.decorations).toEqual([
        { type: "attribute", key: "style", value: "color: red" },
      ]);
    });

    it("converts onClick to click listener", () => {
      const handler = () => {};
      const result = parseFactoryArgs([{ onClick: handler }]);
      expect(result.decorations).toEqual([{ type: "listener", key: "click", value: handler }]);
    });

    it("converts onMouseDown to mousedown listener", () => {
      const handler = () => {};
      const result = parseFactoryArgs([{ onMouseDown: handler }]);
      expect(result.decorations).toEqual([{ type: "listener", key: "mousedown", value: handler }]);
    });

    it("converts onInput to input listener", () => {
      const handler = () => {};
      const result = parseFactoryArgs([{ onInput: handler }]);
      expect(result.decorations).toEqual([{ type: "listener", key: "input", value: handler }]);
    });

    it("treats plain attributes as string attributes", () => {
      const result = parseFactoryArgs([{ href: "/about", target: "_blank" }]);
      expect(result.decorations).toEqual([
        { type: "attribute", key: "href", value: "/about" },
        { type: "attribute", key: "target", value: "_blank" },
      ]);
    });

    it("skips null and false values", () => {
      const result = parseFactoryArgs([{ id: null, disabled: false, classes: null }]);
      expect(result.decorations).toEqual([]);
    });

    it("converts boolean true to string", () => {
      const result = parseFactoryArgs([{ disabled: true }]);
      expect(result.decorations).toEqual([{ type: "attribute", key: "disabled", value: "true" }]);
    });

    it("converts number to string", () => {
      const result = parseFactoryArgs([{ tabindex: 0 }]);
      expect(result.decorations).toEqual([{ type: "attribute", key: "tabindex", value: "0" }]);
    });
  });
});

// =============================================================================
// HTML element factory overloads
// =============================================================================

describe("HTML element factory overloads", () => {
  it("creates empty element with no arguments", () => {
    const gen = div();
    const result = gen.next();
    const element = result.value as Element;

    expect(result.done).toBe(false);
    expect(element).toMatchObject({ type: "element", tag: "div" });
    expect(collectIterator(element.children)).toEqual([]);
  });

  it("creates element with text shorthand", () => {
    const gen = p("Hello");
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: "text", content: "Hello" });
  });

  it("creates element with props only", () => {
    const gen = div({ classes: ["container"], id: "main" });
    const result = gen.next();
    const element = result.value as Element;

    expect(element.decorations).toEqual([
      { type: "attribute", key: "class", value: "container" },
      { type: "attribute", key: "id", value: "main" },
    ]);
    expect(collectIterator(element.children)).toEqual([]);
  });

  it("creates element with props and text", () => {
    const gen = button({ classes: ["btn"], onClick: () => {} }, "Click");
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: "text", content: "Click" });
    expect(element.decorations).toHaveLength(2); // classes + onClick
  });

  it("creates element with props and builder", () => {
    const gen = div({ classes: ["wrapper"] }, function* () {
      yield* text("inner");
    });
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: "text", content: "inner" });
    expect(element.decorations).toEqual([{ type: "attribute", key: "class", value: "wrapper" }]);
  });

  it("creates element with key in props", () => {
    const gen = div({ key: "item-1", classes: ["list-item"] });
    const result = gen.next();
    const element = result.value as Element;

    expect(element.key).toBe("item-1");
    expect(element.decorations).toEqual([{ type: "attribute", key: "class", value: "list-item" }]);
  });

  it("preserves backward compatibility with builder-only call", () => {
    const gen = div(() => [text("old style")]);
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(1);
    expect(children[0]).toEqual({ type: "text", content: "old style" });
  });

  it("preserves backward compatibility with generator builder", () => {
    const gen = div(function* () {
      yield* text("First");
      yield* attr("id", "test");
      yield* text("Second");
    });
    const result = gen.next();
    const element = result.value as Element;

    const children = collectIterator(element.children);
    expect(children).toHaveLength(3);
  });
});

// =============================================================================
// SVG element factory overloads
// =============================================================================

describe("SVG element factory overloads", () => {
  it("creates empty SVG element with no arguments", () => {
    const gen = rect();
    const result = gen.next();
    const element = result.value as SvgElement;

    expect(element).toMatchObject({ type: "svg", tag: "rect" });
  });

  it("creates SVG element with props", () => {
    const gen = circle({ cx: "50", cy: "50", r: "40" });
    const result = gen.next();
    const element = result.value as SvgElement;

    expect(element.decorations).toEqual([
      { type: "attribute", key: "cx", value: "50" },
      { type: "attribute", key: "cy", value: "50" },
      { type: "attribute", key: "r", value: "40" },
    ]);
  });

  it("creates SVG element with props and builder", () => {
    const gen = svg({ viewBox: "0 0 100 100" }, () => [circle(() => [attr("r", "40")])]);
    const result = gen.next();
    const element = result.value as SvgElement;

    expect(element.decorations).toEqual([
      { type: "attribute", key: "viewBox", value: "0 0 100 100" },
    ]);
    const children = collectIterator(element.children);
    expect(children).toHaveLength(1);
  });

  it("preserves backward compatibility with builder-only call", () => {
    const gen = svg(() => []);
    const result = gen.next();
    const element = result.value as SvgElement;

    expect(element).toMatchObject({ type: "svg", tag: "svg" });
  });
});

// =============================================================================
// DOM integration tests
// =============================================================================

describe("Props DOM integration", () => {
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

  it("renders element with classes prop", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div({ classes: ["container", "mx-auto"] }),
    );

    const el = container.querySelector("div");
    expect(el?.getAttribute("class")).toBe("container mx-auto");
  });

  it("renders element with text shorthand", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() => p("Hello, World!"));

    expect(container.querySelector("p")?.textContent).toBe("Hello, World!");
  });

  it("renders element with props and text", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      button({ classes: ["btn"] }, "Click me"),
    );

    const btn = container.querySelector("button");
    expect(btn?.textContent).toBe("Click me");
    expect(btn?.getAttribute("class")).toBe("btn");
  });

  it("renders element with event handler via props", () => {
    const handler = vi.fn();

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      button({ onClick: handler }, "Click"),
    );

    const btn = container.querySelector("button")!;
    btn.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("renders element with style object", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div({ style: { padding: "16px", fontSize: "14px" } }),
    );

    const el = container.querySelector("div");
    expect(el?.getAttribute("style")).toBe("padding: 16px; font-size: 14px");
  });

  it("renders element with style string", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div({ style: "color: red" }),
    );

    const el = container.querySelector("div");
    expect(el?.getAttribute("style")).toBe("color: red");
  });

  it("renders element with classes array filtering falsy", () => {
    const isActive = true;
    const isDisabled = false;

    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div({ classes: ["base", isActive && "active", isDisabled && "disabled"] }),
    );

    const el = container.querySelector("div");
    expect(el?.getAttribute("class")).toBe("base active");
  });

  it("renders element with arbitrary attributes", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      a({ href: "/about", target: "_blank" }, "About"),
    );

    const el = container.querySelector("a");
    expect(el?.getAttribute("href")).toBe("/about");
    expect(el?.getAttribute("target")).toBe("_blank");
    expect(el?.textContent).toBe("About");
  });

  it("renders empty element", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() => div());

    expect(container.querySelector("div")).toBeTruthy();
    expect(container.querySelector("div")?.childNodes.length).toBe(0);
  });

  it("renders nested elements with props", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div({ classes: ["outer"] }, function* () {
        yield* p({ classes: ["inner"] }, "Content");
      }),
    );

    const outer = container.querySelector("div");
    expect(outer?.getAttribute("class")).toBe("outer");
    const inner = outer?.querySelector("p");
    expect(inner?.getAttribute("class")).toBe("inner");
    expect(inner?.textContent).toBe("Content");
  });

  it("works with keyed() wrapper", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        yield* keyed(1, div)({ classes: ["keyed"] }, () => [text("Keyed content")]);
      }),
    );

    const outerDiv = container.firstElementChild!;
    const innerDiv = outerDiv.firstElementChild!;
    expect(innerDiv.getAttribute("class")).toBe("keyed");
    expect(innerDiv.textContent).toBe("Keyed content");
  });

  it("works with props key for keyed elements", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div(function* () {
        yield* div({ key: "stable", classes: ["first"] }, "A");
        yield* div({ key: "other" }, "B");
      }),
    );

    const outerDiv = container.firstElementChild!;
    expect(outerDiv.children.length).toBe(2);
    expect(outerDiv.children[0].getAttribute("class")).toBe("first");
    expect(outerDiv.children[0].textContent).toBe("A");
  });

  it("renders with props and builder mixing old-style primitives", () => {
    scope(createDOMBackend(container), [createBasePlugin()]).mount(() =>
      div({ classes: ["container"] }, function* () {
        yield* attr("data-testid", "root");
        yield* text("mixed content");
      }),
    );

    const el = container.querySelector("div");
    expect(el?.getAttribute("class")).toBe("container");
    expect(el?.getAttribute("data-testid")).toBe("root");
    expect(el?.textContent).toBe("mixed content");
  });
});
