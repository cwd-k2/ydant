import { describe, it, expect, vi, beforeEach } from "vitest";
import { div, span, p, svg, circle } from "@ydant/core";
import { text, attr, clss, on, style } from "@ydant/core";
import { mount } from "../index";

describe("processElement", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("element creation", () => {
    it("creates DOM element with correct tag", () => {
      mount(() => div(() => []), container);

      expect(container.children).toHaveLength(1);
      expect(container.children[0].tagName).toBe("DIV");
    });

    it("creates nested elements", () => {
      mount(() => div(() => [p(() => [text("Hello")]), span(() => [text("World")])]), container);

      const wrapper = container.children[0];
      expect(wrapper.children).toHaveLength(2);
      expect(wrapper.children[0].tagName).toBe("P");
      expect(wrapper.children[1].tagName).toBe("SPAN");
    });

    it("creates SVG elements with namespace", () => {
      mount(
        () => svg(() => [circle(() => [attr("cx", "50"), attr("cy", "50"), attr("r", "40")])]),
        container,
      );

      const svgElement = container.children[0];
      expect(svgElement.tagName).toBe("svg");
      expect(svgElement.namespaceURI).toBe("http://www.w3.org/2000/svg");

      const circleElement = svgElement.children[0];
      expect(circleElement.tagName).toBe("circle");
      expect(circleElement.namespaceURI).toBe("http://www.w3.org/2000/svg");
    });
  });

  describe("attributes", () => {
    it("applies attributes to element", () => {
      mount(
        () =>
          div(function* () {
            yield* attr("id", "test-id");
            yield* attr("data-value", "123");
          }),
        container,
      );

      const element = container.children[0];
      expect(element.getAttribute("id")).toBe("test-id");
      expect(element.getAttribute("data-value")).toBe("123");
    });

    it("applies class attribute via clss", () => {
      mount(
        () =>
          div(function* () {
            yield* clss(["container", "flex", "items-center"]);
          }),
        container,
      );

      const element = container.children[0];
      expect(element.getAttribute("class")).toBe("container flex items-center");
    });
  });

  describe("event listeners", () => {
    it("attaches event listeners", () => {
      const handler = vi.fn();

      mount(
        () =>
          div(function* () {
            yield* on("click", handler);
          }),
        container,
      );

      const element = container.children[0] as HTMLElement;
      element.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("text content", () => {
    it("creates text nodes", () => {
      mount(() => div(() => [text("Hello, World!")]), container);

      const element = container.children[0];
      expect(element.textContent).toBe("Hello, World!");
    });

    it("handles multiple text nodes", () => {
      mount(() => div(() => [text("Hello, "), text("World!")]), container);

      const element = container.children[0];
      expect(element.textContent).toBe("Hello, World!");
    });
  });

  describe("inline styles", () => {
    it("applies inline styles", () => {
      mount(
        () =>
          div(function* () {
            yield* style({
              padding: "16px",
              display: "flex",
            });
          }),
        container,
      );

      const element = container.children[0] as HTMLElement;
      expect(element.style.padding).toBe("16px");
      expect(element.style.display).toBe("flex");
    });

    it("applies CSS custom properties", () => {
      mount(
        () =>
          div(function* () {
            yield* style({
              "--custom-color": "#ff0000",
            });
          }),
        container,
      );

      const element = container.children[0] as HTMLElement;
      expect(element.style.getPropertyValue("--custom-color")).toBe("#ff0000");
    });
  });

  describe("Slot", () => {
    it("returns Slot from element generator", () => {
      let capturedSlot: { node: HTMLElement; refresh: Function } | null = null;

      mount(
        () =>
          div(function* () {
            const slot = yield* p(() => [text("Initial")]);
            capturedSlot = slot;
          }),
        container,
      );

      expect(capturedSlot).not.toBeNull();
      expect(capturedSlot!.node).toBeInstanceOf(HTMLElement);
      expect(capturedSlot!.node.tagName).toBe("P");
    });

    it("Slot.refresh() re-renders children", () => {
      let slot: { node: HTMLElement; refresh: (fn: () => any) => void } | null = null;

      mount(
        () =>
          div(function* () {
            slot = yield* p(() => [text("Initial")]);
          }),
        container,
      );

      expect(slot!.node.textContent).toBe("Initial");

      slot!.refresh(() => [text("Updated")]);

      expect(slot!.node.textContent).toBe("Updated");
    });

    it("Slot.refresh() clears and rebuilds children", () => {
      let slot: { node: HTMLElement; refresh: (fn: () => any) => void } | null = null;

      mount(
        () =>
          div(function* () {
            slot = yield* div(() => [p(() => [text("Para 1")]), p(() => [text("Para 2")])]);
          }),
        container,
      );

      expect(slot!.node.children).toHaveLength(2);

      slot!.refresh(() => [span(() => [text("Single span")])]);

      expect(slot!.node.children).toHaveLength(1);
      expect(slot!.node.children[0].tagName).toBe("SPAN");
    });
  });
});
