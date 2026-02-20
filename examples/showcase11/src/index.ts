/**
 * Showcase 11 — Canvas Embed
 *
 * Demonstrates embedding a Canvas2D rendering scope inside a DOM render
 * using ExecutionScope and the embed() spell.
 *
 * DOM elements wrap a <canvas>, and embed() switches to a Canvas backend
 * for declarative shape rendering — all within a single mount().
 */

import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin, createHTMLElement, div, h1, p } from "@ydant/base";
import {
  createCanvasBackend,
  createCanvasPlugin,
  group,
  rect,
  circle,
  line,
  canvasText,
} from "@ydant/canvas";

const canvas = createHTMLElement("canvas");

// =============================================================================
// Canvas scene (runs under Canvas scope)
// =============================================================================

const NightScene = () =>
  group(() => [
    // Sky
    rect({ x: "0", y: "0", width: "600", height: "400", fill: "#0f3460" }),

    // Stars
    ...Array.from({ length: 30 }, (_, i) => {
      const x = String(((i * 137 + 50) % 580) + 10);
      const y = String(((i * 97 + 20) % 300) + 10);
      const r = String(1 + (i % 3));
      return circle({
        cx: x,
        cy: y,
        r,
        fill: "#e0e0e0",
        opacity: String(0.4 + (i % 5) * 0.15),
      });
    }),

    // Moon (crescent)
    circle({ cx: "480", cy: "80", r: "40", fill: "#f5e6ca" }),
    circle({ cx: "500", cy: "70", r: "35", fill: "#0f3460" }),

    // Mountains
    rect({ x: "0", y: "280", width: "600", height: "120", fill: "#1a1a2e" }),
    ...mountainPeak(100, 200, 180),
    ...mountainPeak(250, 180, 200),
    ...mountainPeak(420, 220, 160),

    // Ground
    rect({ x: "0", y: "340", width: "600", height: "60", fill: "#16213e" }),

    // Trees
    ...tree(80, 320),
    ...tree(200, 330),
    ...tree(350, 315),
    ...tree(500, 325),

    // Caption
    canvasText({
      x: "300",
      y: "380",
      content: "Rendered with @ydant/canvas via embed()",
      font: "14px monospace",
      fill: "#666",
      textAlign: "center",
    }),
  ]);

function mountainPeak(cx: number, top: number, width: number) {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const base = 340;
  return [
    line({
      x1: String(left),
      y1: String(base),
      x2: String(cx),
      y2: String(top),
      stroke: "#533483",
      lineWidth: "2",
    }),
    line({
      x1: String(cx),
      y1: String(top),
      x2: String(right),
      y2: String(base),
      stroke: "#533483",
      lineWidth: "2",
    }),
  ];
}

function tree(x: number, y: number) {
  return [
    rect({
      x: String(x - 3),
      y: String(y - 20),
      width: "6",
      height: "20",
      fill: "#5c3d2e",
    }),
    circle({ cx: String(x), cy: String(y - 30), r: "12", fill: "#2d6a4f" }),
  ];
}

// =============================================================================
// DOM App
// =============================================================================

const App = () =>
  div({ class: "container" }, function* () {
    yield* h1("Canvas Embed");
    yield* p(
      { class: "subtitle" },
      "DOM content above — the canvas below is rendered via embed() with a Canvas backend",
    );

    // 1. Create a <canvas> DOM element
    const canvasBackend = createCanvasBackend();
    const slot = yield* canvas({ width: "600", height: "400" });
    const canvasEl = slot.node as HTMLCanvasElement;

    // 2. Embed Canvas scope — builds VShape tree synchronously
    yield* scope(canvasBackend, [createBasePlugin(), createCanvasPlugin()]).embed(NightScene);

    // 3. Paint the virtual tree onto the real <canvas>
    canvasBackend.paint(canvasEl.getContext("2d")!);

    yield* p({ class: "subtitle" }, "DOM content below — everything is part of the same mount()");
  });

// =============================================================================
// Mount into DOM
// =============================================================================

scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()]).mount(App);
