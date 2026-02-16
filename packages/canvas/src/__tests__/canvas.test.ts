import { describe, it, expect, expectTypeOf, vi } from "vitest";
import { mount } from "@ydant/core";
import type { CapabilityCheck, ProvidedCapabilities } from "@ydant/core";
import { createBasePlugin, attr, on } from "@ydant/base";
import {
  createCanvasCapabilities,
  rect,
  circle,
  group,
  canvasText,
  line,
  ellipse,
  canvasPath,
} from "../index";

describe("Canvas capabilities", () => {
  it("creates a VShape tree from generators", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        group(() => [
          rect(() => [
            attr("x", "10"),
            attr("y", "20"),
            attr("width", "100"),
            attr("height", "50"),
            attr("fill", "#ff0000"),
          ]),
          circle(() => [
            attr("cx", "200"),
            attr("cy", "100"),
            attr("r", "30"),
            attr("fill", "#0000ff"),
          ]),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    expect(cap.root.children).toHaveLength(1);
    const groupShape = cap.root.children[0];
    expect(groupShape.tag).toBe("group");
    expect(groupShape.children).toHaveLength(2);

    const rectShape = groupShape.children[0];
    expect(rectShape.tag).toBe("rect");
    expect(rectShape.props.get("x")).toBe("10");
    expect(rectShape.props.get("width")).toBe("100");
    expect(rectShape.props.get("fill")).toBe("#ff0000");

    const circleShape = groupShape.children[1];
    expect(circleShape.tag).toBe("circle");
    expect(circleShape.props.get("cx")).toBe("200");
    expect(circleShape.props.get("r")).toBe("30");
  });

  it("creates text shapes", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        canvasText(() => [
          attr("x", "50"),
          attr("y", "50"),
          attr("content", "Hello Canvas"),
          attr("font", "24px sans-serif"),
          attr("fill", "#000"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    expect(cap.root.children).toHaveLength(1);
    const textShape = cap.root.children[0];
    expect(textShape.tag).toBe("text");
    expect(textShape.props.get("content")).toBe("Hello Canvas");
    expect(textShape.props.get("font")).toBe("24px sans-serif");
  });

  it("creates line shapes", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        line(() => [
          attr("x1", "0"),
          attr("y1", "0"),
          attr("x2", "100"),
          attr("y2", "100"),
          attr("stroke", "#000"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const lineShape = cap.root.children[0];
    expect(lineShape.tag).toBe("line");
    expect(lineShape.props.get("x2")).toBe("100");
  });

  it("creates ellipse shapes", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        ellipse(() => [
          attr("cx", "100"),
          attr("cy", "75"),
          attr("rx", "50"),
          attr("ry", "30"),
          attr("fill", "green"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const shape = cap.root.children[0];
    expect(shape.tag).toBe("ellipse");
    expect(shape.props.get("rx")).toBe("50");
    expect(shape.props.get("ry")).toBe("30");
  });

  it("creates canvasPath shapes", () => {
    const cap = createCanvasCapabilities();

    mount(() => canvasPath(() => [attr("d", "M 10 10 L 90 90"), attr("stroke", "#000")]), {
      root: cap.root,
      plugins: [cap, createBasePlugin()],
    });

    const shape = cap.root.children[0];
    expect(shape.tag).toBe("path");
    expect(shape.props.get("d")).toBe("M 10 10 L 90 90");
  });

  it("does not provide interact capability", () => {
    type Canvas = [ReturnType<typeof createCanvasCapabilities>];
    expectTypeOf<ProvidedCapabilities<Canvas>>().toEqualTypeOf<"tree" | "decorate" | "schedule">();
  });

  it("rejects generators that require interact", () => {
    function* app() {
      yield* rect(() => []);
      yield* on("click", () => {});
    }

    type Result = CapabilityCheck<
      ReturnType<typeof app>,
      [ReturnType<typeof createCanvasCapabilities>]
    >;
    expectTypeOf<Result>().toHaveProperty("__capabilityError");
  });

  it("silently ignores listeners in children (interact not provided)", () => {
    const cap = createCanvasCapabilities();

    expect(() => {
      mount(() => rect(() => [attr("fill", "red"), on("click", () => {})]), {
        root: cap.root,
        plugins: [cap, createBasePlugin()],
      });
    }).not.toThrow();

    expect(cap.root.children).toHaveLength(1);
  });

  it("clears root on re-render via beforeRender", () => {
    const cap = createCanvasCapabilities();
    const App = () => rect(() => [attr("fill", "red")]);

    mount(App, { root: cap.root, plugins: [cap, createBasePlugin()] });
    expect(cap.root.children).toHaveLength(1);

    mount(App, { root: cap.root, plugins: [cap, createBasePlugin()] });
    expect(cap.root.children).toHaveLength(1);
  });
});

describe("Canvas paint", () => {
  function createMockCanvas(): CanvasRenderingContext2D {
    return {
      canvas: { width: 400, height: 300 },
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      ellipse: vi.fn(),
      roundRect: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      globalAlpha: 1,
      textAlign: "start" as CanvasTextAlign,
      textBaseline: "alphabetic" as CanvasTextBaseline,
    } as unknown as CanvasRenderingContext2D;
  }

  it("paints shapes to a Canvas2D context", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        group(() => [
          rect(() => [
            attr("x", "10"),
            attr("y", "20"),
            attr("width", "100"),
            attr("height", "50"),
            attr("fill", "#ff0000"),
          ]),
          circle(() => [
            attr("cx", "200"),
            attr("cy", "100"),
            attr("r", "30"),
            attr("fill", "#0000ff"),
            attr("stroke", "#000"),
          ]),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
    expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
    expect(mockCtx.arc).toHaveBeenCalledWith(200, 100, 30, 0, Math.PI * 2);
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it("paints text shapes", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        canvasText(() => [
          attr("x", "50"),
          attr("y", "50"),
          attr("content", "Hello"),
          attr("fill", "#000"),
          attr("font", "16px Arial"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockCtx.fillText).toHaveBeenCalledWith("Hello", 50, 50);
  });

  it("paints nested groups", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        group(() => [
          rect(() => [
            attr("x", "0"),
            attr("y", "0"),
            attr("width", "50"),
            attr("height", "50"),
            attr("fill", "red"),
          ]),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 50, 50);
  });

  it("paints line shapes", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        line(() => [
          attr("x1", "10"),
          attr("y1", "20"),
          attr("x2", "100"),
          attr("y2", "200"),
          attr("stroke", "#000"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockCtx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 200);
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it("paints ellipse shapes", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        ellipse(() => [
          attr("cx", "100"),
          attr("cy", "75"),
          attr("rx", "50"),
          attr("ry", "30"),
          attr("fill", "green"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockCtx.ellipse).toHaveBeenCalledWith(100, 75, 50, 30, 0, 0, Math.PI * 2);
    expect(mockCtx.fill).toHaveBeenCalled();
  });

  it("paints path shapes via Path2D", () => {
    // Path2D is not available in jsdom; provide a minimal stub
    const mockPath2D = vi.fn();
    vi.stubGlobal("Path2D", mockPath2D);

    const cap = createCanvasCapabilities();

    mount(
      () =>
        canvasPath(() => [
          attr("d", "M 10 10 L 90 90"),
          attr("fill", "red"),
          attr("stroke", "blue"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockPath2D).toHaveBeenCalledWith("M 10 10 L 90 90");
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("paints rect with roundRect when rx is set", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        rect(() => [
          attr("x", "10"),
          attr("y", "20"),
          attr("width", "100"),
          attr("height", "50"),
          attr("rx", "8"),
          attr("fill", "blue"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockCtx.roundRect).toHaveBeenCalledWith(10, 20, 100, 50, 8);
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.fillRect).not.toHaveBeenCalled();
  });

  it("applies opacity via globalAlpha", () => {
    const cap = createCanvasCapabilities();

    mount(
      () =>
        rect(() => [
          attr("x", "0"),
          attr("y", "0"),
          attr("width", "50"),
          attr("height", "50"),
          attr("fill", "red"),
          attr("opacity", "0.5"),
        ]),
      { root: cap.root, plugins: [cap, createBasePlugin()] },
    );

    const mockCtx = createMockCanvas();
    cap.paint(mockCtx);

    expect(mockCtx.globalAlpha).toBe(0.5);
  });
});
