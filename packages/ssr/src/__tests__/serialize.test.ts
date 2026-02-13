import { describe, expect, test } from "vitest";
import { toHTML } from "../serialize";
import type { VElement, VRoot, VText } from "../vnode";

function vtext(content: string): VText {
  return { kind: "text", content };
}

function velement(
  tag: string,
  attrs: Record<string, string> = {},
  children: (VElement | VText)[] = [],
): VElement {
  return {
    kind: "element",
    tag,
    attributes: new Map(Object.entries(attrs)),
    children,
  };
}

function vroot(...children: (VElement | VText)[]): VRoot {
  return { kind: "root", children };
}

describe("toHTML", () => {
  test("empty root", () => {
    expect(toHTML(vroot())).toBe("");
  });

  test("text node escapes special characters", () => {
    expect(toHTML(vroot(vtext("a < b & c > d")))).toBe("a &lt; b &amp; c &gt; d");
  });

  test("empty element", () => {
    expect(toHTML(vroot(velement("div")))).toBe("<div></div>");
  });

  test("element with attributes", () => {
    const el = velement("div", { class: "foo", id: "bar" });
    expect(toHTML(vroot(el))).toBe('<div class="foo" id="bar"></div>');
  });

  test("attribute value escapes quotes and ampersands", () => {
    const el = velement("div", { title: 'say "hello" & goodbye' });
    expect(toHTML(vroot(el))).toBe('<div title="say &quot;hello&quot; &amp; goodbye"></div>');
  });

  test("element with text child", () => {
    const el = velement("p", {}, [vtext("Hello")]);
    expect(toHTML(vroot(el))).toBe("<p>Hello</p>");
  });

  test("nested elements", () => {
    const inner = velement("span", {}, [vtext("world")]);
    const outer = velement("div", {}, [vtext("hello "), inner]);
    expect(toHTML(vroot(outer))).toBe("<div>hello <span>world</span></div>");
  });

  test("void elements are self-closing", () => {
    expect(toHTML(vroot(velement("br")))).toBe("<br>");
    expect(toHTML(vroot(velement("hr")))).toBe("<hr>");
    expect(toHTML(vroot(velement("img", { src: "a.png" })))).toBe('<img src="a.png">');
    expect(toHTML(vroot(velement("input", { type: "text" })))).toBe('<input type="text">');
  });

  test("multiple root children", () => {
    const root = vroot(velement("p", {}, [vtext("A")]), velement("p", {}, [vtext("B")]));
    expect(toHTML(root)).toBe("<p>A</p><p>B</p>");
  });

  test("toHTML on VElement returns inner HTML", () => {
    const el = velement("div", {}, [vtext("inside")]);
    expect(toHTML(el)).toBe("inside");
  });

  test("SVG element with namespace", () => {
    const svg = velement("svg", { xmlns: "http://www.w3.org/2000/svg" }, [
      velement("circle", { cx: "50", cy: "50", r: "40" }),
    ]);
    expect(toHTML(vroot(svg))).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"></circle></svg>',
    );
  });
});
