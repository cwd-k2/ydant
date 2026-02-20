import { describe, it, expect, expectTypeOf, vi } from "vitest";
import { scope } from "@ydant/core";
import type { ProvidedCapabilities } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import {
  createCanvasBackend,
  createCanvasPlugin,
  rect,
  circle,
  group,
  canvasText,
  line,
  ellipse,
  canvasPath,
} from "../index";

describe("Canvas backend", () => {
  it("creates a VShape tree from generators", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      group(() => [
        rect({ x: "10", y: "20", width: "100", height: "50", fill: "#ff0000" }),
        circle({ cx: "200", cy: "100", r: "30", fill: "#0000ff" }),
      ]),
    );

    expect(canvas.root.children).toHaveLength(1);
    const groupShape = canvas.root.children[0];
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
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      canvasText({
        x: "50",
        y: "50",
        content: "Hello Canvas",
        font: "24px sans-serif",
        fill: "#000",
      }),
    );

    expect(canvas.root.children).toHaveLength(1);
    const textShape = canvas.root.children[0];
    expect(textShape.tag).toBe("text");
    expect(textShape.props.get("content")).toBe("Hello Canvas");
    expect(textShape.props.get("font")).toBe("24px sans-serif");
  });

  it("creates line shapes", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      line({ x1: "0", y1: "0", x2: "100", y2: "100", stroke: "#000" }),
    );

    const lineShape = canvas.root.children[0];
    expect(lineShape.tag).toBe("line");
    expect(lineShape.props.get("x2")).toBe("100");
  });

  it("creates ellipse shapes", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      ellipse({ cx: "100", cy: "75", rx: "50", ry: "30", fill: "green" }),
    );

    const shape = canvas.root.children[0];
    expect(shape.tag).toBe("ellipse");
    expect(shape.props.get("rx")).toBe("50");
    expect(shape.props.get("ry")).toBe("30");
  });

  it("creates canvasPath shapes", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      canvasPath({ d: "M 10 10 L 90 90", stroke: "#000" }),
    );

    const shape = canvas.root.children[0];
    expect(shape.tag).toBe("path");
    expect(shape.props.get("d")).toBe("M 10 10 L 90 90");
  });

  it("does not provide interact capability", () => {
    type Canvas = ReturnType<typeof createCanvasBackend>;
    expectTypeOf<ProvidedCapabilities<Canvas>>().toEqualTypeOf<"tree" | "decorate" | "schedule">();
  });

  it("silently ignores event handler props (interact not provided)", () => {
    const canvas = createCanvasBackend();

    expect(() => {
      scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
        rect({ fill: "red", onClick: () => {} }),
      );
    }).not.toThrow();

    expect(canvas.root.children).toHaveLength(1);
  });

  it("clears root on re-render via beforeRender", () => {
    const canvas = createCanvasBackend();
    const App = () => rect({ fill: "red" });

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(App);
    expect(canvas.root.children).toHaveLength(1);

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(App);
    expect(canvas.root.children).toHaveLength(1);
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
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      group(() => [
        rect({ x: "10", y: "20", width: "100", height: "50", fill: "#ff0000" }),
        circle({ cx: "200", cy: "100", r: "30", fill: "#0000ff", stroke: "#000" }),
      ]),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
    expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 100, 50);
    expect(mockCtx.arc).toHaveBeenCalledWith(200, 100, 30, 0, Math.PI * 2);
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it("paints text shapes", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      canvasText({ x: "50", y: "50", content: "Hello", fill: "#000", font: "16px Arial" }),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockCtx.fillText).toHaveBeenCalledWith("Hello", 50, 50);
  });

  it("paints nested groups", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      group(() => [rect({ x: "0", y: "0", width: "50", height: "50", fill: "red" })]),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 50, 50);
  });

  it("paints line shapes", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      line({ x1: "10", y1: "20", x2: "100", y2: "200", stroke: "#000" }),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockCtx.moveTo).toHaveBeenCalledWith(10, 20);
    expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 200);
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it("paints ellipse shapes", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      ellipse({ cx: "100", cy: "75", rx: "50", ry: "30", fill: "green" }),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockCtx.ellipse).toHaveBeenCalledWith(100, 75, 50, 30, 0, 0, Math.PI * 2);
    expect(mockCtx.fill).toHaveBeenCalled();
  });

  it("paints path shapes via Path2D", () => {
    // Path2D is not available in jsdom; provide a minimal stub
    const mockPath2D = vi.fn();
    vi.stubGlobal("Path2D", mockPath2D);

    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      canvasPath({ d: "M 10 10 L 90 90", fill: "red", stroke: "blue" }),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockPath2D).toHaveBeenCalledWith("M 10 10 L 90 90");
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("paints rect with roundRect when rx is set", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      rect({ x: "10", y: "20", width: "100", height: "50", rx: "8", fill: "blue" }),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockCtx.roundRect).toHaveBeenCalledWith(10, 20, 100, 50, 8);
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.fillRect).not.toHaveBeenCalled();
  });

  it("applies opacity via globalAlpha", () => {
    const canvas = createCanvasBackend();

    scope(canvas, [createBasePlugin(), createCanvasPlugin()]).mount(() =>
      rect({ x: "0", y: "0", width: "50", height: "50", fill: "red", opacity: "0.5" }),
    );

    const mockCtx = createMockCanvas();
    canvas.paint(mockCtx);

    expect(mockCtx.globalAlpha).toBe(0.5);
  });
});
