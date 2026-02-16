/**
 * Showcase 11 — Canvas2D Rendering
 *
 * Demonstrates @ydant/canvas: the same core processing system and base plugin
 * drive a completely different rendering target (Canvas2D instead of DOM).
 */

import { mount, type Component } from "@ydant/core";
import { createBasePlugin, attr } from "@ydant/base";
import { createCanvasBackend, group, rect, circle, canvasText, line } from "@ydant/canvas";

// --- Scene description using Ydant generators ---

const Scene: Component = () =>
  group(() => [
    // Background gradient rectangles
    rect(() => [
      attr("x", "0"),
      attr("y", "0"),
      attr("width", "600"),
      attr("height", "400"),
      attr("fill", "#0f3460"),
    ]),

    // Stars (small circles)
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

    // Moon
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

    // Mountain peaks (triangles via lines)
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

    // Title text
    canvasText(() => [
      attr("x", "300"),
      attr("y", "380"),
      attr("content", "Rendered with @ydant/canvas"),
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
    // Trunk
    rect(() => [
      attr("x", String(x - 3)),
      attr("y", String(y - 20)),
      attr("width", "6"),
      attr("height", "20"),
      attr("fill", "#5c3d2e"),
    ]),
    // Canopy
    circle(() => [
      attr("cx", String(x)),
      attr("cy", String(y - 30)),
      attr("r", "12"),
      attr("fill", "#2d6a4f"),
    ]),
  ];
}

// --- Mount and paint ---

const canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
const ctx2d = canvasEl.getContext("2d")!;

const canvas = createCanvasBackend();

mount(Scene, {
  backend: canvas,
  plugins: [createBasePlugin()],
});

canvas.paint(ctx2d);
