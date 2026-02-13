import { describe, expect, test } from "vitest";
import type { Component } from "@ydant/core";
import { attr, button, classes, div, h1, li, on, p, text, ul } from "@ydant/base";
import { renderToString } from "../render";

describe("renderToString", () => {
  test("simple component", () => {
    const App: Component = () => div(() => [text("Hello, SSR!")]);
    expect(renderToString(App)).toBe("<div>Hello, SSR!</div>");
  });

  test("uses createBasePlugin by default", () => {
    // Attributes and elements work without explicitly passing plugins
    const App: Component = () => div(() => [attr("id", "root"), classes("app"), text("works")]);
    expect(renderToString(App)).toBe('<div id="root" class="app">works</div>');
  });

  test("complex component tree", () => {
    function* Header() {
      yield* h1(() => [classes("title"), text("My App")]);
    }

    function* Nav() {
      yield* ul(() => [li(() => [text("Home")]), li(() => [text("About")])]);
    }

    const App: Component = function* () {
      yield* div(function* () {
        yield* classes("container");
        yield* Header();
        yield* Nav();
        yield* p(() => [text("Welcome!")]);
      });
    };

    expect(renderToString(App)).toBe(
      '<div class="container">' +
        '<h1 class="title">My App</h1>' +
        "<ul><li>Home</li><li>About</li></ul>" +
        "<p>Welcome!</p>" +
        "</div>",
    );
  });

  test("event handlers are silently ignored", () => {
    const App: Component = () => button(() => [on("click", () => {}), text("Click me")]);
    expect(renderToString(App)).toBe("<button>Click me</button>");
  });

  test("text escaping in rendered HTML", () => {
    const App: Component = () => div(() => [text("1 < 2 & 3 > 2")]);
    expect(renderToString(App)).toBe("<div>1 &lt; 2 &amp; 3 &gt; 2</div>");
  });

  test("component with props pattern", () => {
    function* Card(props: { title: string; body: string }) {
      yield* div(() => [
        classes("card"),
        h1(() => [text(props.title)]),
        p(() => [text(props.body)]),
      ]);
    }

    const App: Component = function* () {
      yield* Card({ title: "Hello", body: "World" });
    };

    expect(renderToString(App)).toBe('<div class="card"><h1>Hello</h1><p>World</p></div>');
  });
});
