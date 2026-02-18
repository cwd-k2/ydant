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
import {
  createDOMBackend,
  createBasePlugin,
  createHTMLElement,
  div,
  h1,
  p,
  text,
  attr,
} from "@ydant/base";
import { createCanvasBackend, group, rect, circle, line, canvasText } from "@ydant/canvas";

const canvas = createHTMLElement("canvas");

// =============================================================================
// Canvas scene (runs under Canvas scope)
// =============================================================================

const NightScene = () =>
  group(() => [
    // Sky
    rect(() => [
      attr("x", "0"),
      attr("y", "0"),
      attr("width", "600"),
      attr("height", "400"),
      attr("fill", "#0f3460"),
    ]),

    // Stars
    ...Array.from({ length: 30 }, (_, i) => {
      const x = String(((i * 137 + 50) % 580) + 10);
      const y = String(((i * 97 + 20) % 300) + 10);
      const r = String(1 + (i % 3));
      return circle(() => [
        attr("cx", x),
        attr("cy", y),
        attr("r", r),
        attr("fill", "#e0e0e0"),
        attr("opacity", String(0.4 + (i % 5) * 0.15)),
      ]);
    }),

    // Moon (crescent)
    circle(() => [attr("cx", "480"), attr("cy", "80"), attr("r", "40"), attr("fill", "#f5e6ca")]),
    circle(() => [attr("cx", "500"), attr("cy", "70"), attr("r", "35"), attr("fill", "#0f3460")]),

    // Mountains
    rect(() => [
      attr("x", "0"),
      attr("y", "280"),
      attr("width", "600"),
      attr("height", "120"),
      attr("fill", "#1a1a2e"),
    ]),
    ...mountainPeak(100, 200, 180),
    ...mountainPeak(250, 180, 200),
    ...mountainPeak(420, 220, 160),

    // Ground
    rect(() => [
      attr("x", "0"),
      attr("y", "340"),
      attr("width", "600"),
      attr("height", "60"),
      attr("fill", "#16213e"),
    ]),

    // Trees
    ...tree(80, 320),
    ...tree(200, 330),
    ...tree(350, 315),
    ...tree(500, 325),

    // Caption
    canvasText(() => [
      attr("x", "300"),
      attr("y", "380"),
      attr("content", "Rendered with @ydant/canvas via embed()"),
      attr("font", "14px monospace"),
      attr("fill", "#666"),
      attr("textAlign", "center"),
    ]),
  ]);

function mountainPeak(cx: number, top: number, width: number) {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const base = 340;
  return [
    line(() => [
      attr("x1", String(left)),
      attr("y1", String(base)),
      attr("x2", String(cx)),
      attr("y2", String(top)),
      attr("stroke", "#533483"),
      attr("lineWidth", "2"),
    ]),
    line(() => [
      attr("x1", String(cx)),
      attr("y1", String(top)),
      attr("x2", String(right)),
      attr("y2", String(base)),
      attr("stroke", "#533483"),
      attr("lineWidth", "2"),
    ]),
  ];
}

function tree(x: number, y: number) {
  return [
    rect(() => [
      attr("x", String(x - 3)),
      attr("y", String(y - 20)),
      attr("width", "6"),
      attr("height", "20"),
      attr("fill", "#5c3d2e"),
    ]),
    circle(() => [
      attr("cx", String(x)),
      attr("cy", String(y - 30)),
      attr("r", "12"),
      attr("fill", "#2d6a4f"),
    ]),
  ];
}

// =============================================================================
// DOM App
// =============================================================================

const App = () =>
  div(function* () {
    yield* attr("class", "container");

    yield* h1(() => [text("Canvas Embed")]);
    yield* p(() => [
      attr("class", "subtitle"),
      text("DOM content above — the canvas below is rendered via embed() with a Canvas backend"),
    ]);

    // 1. Create a <canvas> DOM element
    const canvasBackend = createCanvasBackend();
    const slot = yield* canvas(function* () {
      yield* attr("width", "600");
      yield* attr("height", "400");
    });
    const canvasEl = slot.node as HTMLCanvasElement;

    // 2. Embed Canvas scope — builds VShape tree synchronously
    yield* scope(canvasBackend, [createBasePlugin()]).embed(NightScene);

    // 3. Paint the virtual tree onto the real <canvas>
    canvasBackend.paint(canvasEl.getContext("2d")!);

    yield* p(() => [
      attr("class", "subtitle"),
      text("DOM content below — everything is part of the same mount()"),
    ]);
  });

// =============================================================================
// Mount into DOM
// =============================================================================

scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()]).mount(App);
