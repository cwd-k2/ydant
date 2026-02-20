import { describe, expect, test } from "vitest";
import type { Component } from "@ydant/core";
import { scope } from "@ydant/core";
import { createBasePlugin, div, p, span, text } from "@ydant/base";
import { createSSRBackend } from "../target";

function renderHTML(app: Component): string {
  const backend = createSSRBackend();
  const handle = scope(backend, [createBasePlugin()]).mount(app);
  const html = backend.toHTML();
  handle.dispose();
  return html;
}

describe("createSSRBackend", () => {
  test("text node", () => {
    const App: Component = () => text("Hello");
    expect(renderHTML(App)).toBe("Hello");
  });

  test("div with text", () => {
    const App: Component = () => div(() => [text("Hello")]);
    expect(renderHTML(App)).toBe("<div>Hello</div>");
  });

  test("attributes via props", () => {
    const App: Component = () => div({ id: "main", class: "container" }, "content");
    expect(renderHTML(App)).toBe('<div id="main" class="container">content</div>');
  });

  test("nested components", () => {
    function* Inner() {
      yield* span("inner");
    }

    const App: Component = function* () {
      yield* div(function* () {
        yield* text("before ");
        yield* Inner();
        yield* text(" after");
      });
    };
    expect(renderHTML(App)).toBe("<div>before <span>inner</span> after</div>");
  });

  test("event handler props are silently ignored", () => {
    const App: Component = () => div({ onClick: () => {} }, "clickable");
    // Should not throw, events are no-op in SSR
    expect(renderHTML(App)).toBe("<div>clickable</div>");
  });

  test("multiple top-level elements", () => {
    const App: Component = function* () {
      yield* p("A");
      yield* p("B");
    };
    expect(renderHTML(App)).toBe("<p>A</p><p>B</p>");
  });

  test("deeply nested structure", () => {
    const App: Component = () => div(() => [div(() => [span("deep")])]);
    expect(renderHTML(App)).toBe("<div><div><span>deep</span></div></div>");
  });
});
