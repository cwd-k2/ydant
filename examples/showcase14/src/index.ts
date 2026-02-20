/**
 * Showcase 14 — Reactive Canvas
 *
 * Signal-driven Canvas rendering with Engine.onFlush() auto-repaint.
 *
 * DOM buttons change Signals → reactive blocks in Canvas scope rerender
 * the VShape tree → Engine flush triggers onFlush → paint() updates Canvas.
 *
 * Validates:
 * - reactive() working inside Canvas scope
 * - Signal changes routing to canvas engine (not DOM engine)
 * - onFlush firing after flush and triggering paint()
 * - Multiple Signal changes batching into a single rerender
 */

import { scope } from "@ydant/core";
import { createDevtoolsOverlay } from "@ydant/devtools";
import { createDOMBackend, createBasePlugin, createHTMLElement, html } from "@ydant/base";
import {
  createCanvasBackend,
  createCanvasPlugin,
  group,
  rect,
  circle,
  canvasText,
} from "@ydant/canvas";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";

const { div, h1, p } = html;
const canvas = createHTMLElement("canvas");

// =============================================================================
// Signals — shared between DOM and Canvas scopes
// =============================================================================

const cx = signal(300);
const cy = signal(200);
const radius = signal(40);
const colorIndex = signal(0);

const COLORS = ["#e94560", "#0f3460", "#533483", "#16c79a", "#f5e6ca", "#ff9a3c"];
const color = () => COLORS[colorIndex() % COLORS.length];

let paintCount = 0;

// =============================================================================
// Canvas scene (runs under Canvas scope via embed)
// =============================================================================

const Scene = () =>
  group(function* () {
    // Static background grid
    for (let x = 0; x <= 600; x += 50) {
      yield* rect({ x: String(x), y: "0", width: "1", height: "400", fill: "#1a3a5c" });
    }
    for (let y = 0; y <= 400; y += 50) {
      yield* rect({ x: "0", y: String(y), width: "600", height: "1", fill: "#1a3a5c" });
    }

    // Reactive shape — tracks cx, cy, radius, colorIndex signals
    yield* reactive(() => [
      // Shadow
      circle({
        cx: String(cx() + 4),
        cy: String(cy() + 4),
        r: String(radius()),
        fill: "rgba(0,0,0,0.3)",
      }),
      // Main circle
      circle({
        cx: String(cx()),
        cy: String(cy()),
        r: String(radius()),
        fill: color(),
      }),
      // Label
      canvasText({
        x: String(cx()),
        y: String(cy() + radius() + 20),
        content: `(${cx()}, ${cy()}) r=${radius()}`,
        font: "12px monospace",
        fill: "#aaa",
        textAlign: "center",
      }),
    ]);
  });

// =============================================================================
// DOM App
// =============================================================================

const canvasBackend = createCanvasBackend();
const canvasBuilder = scope(canvasBackend, [
  createBasePlugin(),
  createCanvasPlugin(),
  createReactivePlugin(),
]);

let canvasCtx2d: CanvasRenderingContext2D;

const App = () =>
  div({ class: "container" }, function* () {
    yield* h1("Reactive Canvas");
    yield* p({ class: "subtitle" }, "Signal changes auto-repaint the Canvas via Engine.onFlush()");

    // Canvas element (DOM)
    const slot = yield* canvas({ width: "600", height: "400" });
    canvasCtx2d = (slot.node as HTMLCanvasElement).getContext("2d")!;

    // Embed Canvas scope — builds VShape tree with reactive tracking
    const canvasEngine = yield* canvasBuilder.embed(Scene);

    // Register auto-repaint: when the canvas engine flushes, paint the updated VShape tree
    canvasEngine.onFlush(() => {
      paintCount++;
      canvasBackend.paint(canvasCtx2d);
    });

    // Initial paint
    canvasBackend.paint(canvasCtx2d);

    // Controls
    const step = 20;
    const btn = (label: string, handler: () => void) => html.button({ onClick: handler }, label);

    yield* div({ class: "controls" }, function* () {
      yield* btn("\u2191", () => cy.update((v) => Math.max(radius(), v - step)));
      yield* btn("\u2190", () => cx.update((v) => Math.max(radius(), v - step)));
      yield* btn("\u2192", () => cx.update((v) => Math.min(600 - radius(), v + step)));
      yield* btn("\u2193", () => cy.update((v) => Math.min(400 - radius(), v + step)));
      yield* btn("\u2212", () => radius.update((v) => Math.max(10, v - 10)));
      yield* btn("+", () => radius.update((v) => Math.min(100, v + 10)));
      yield* btn("Color", () => colorIndex.update((v) => v + 1));
      yield* btn("Randomize", () => {
        // Change all signals at once — demonstrates batching
        cx.set(100 + Math.floor(Math.random() * 400));
        cy.set(50 + Math.floor(Math.random() * 300));
        radius.set(20 + Math.floor(Math.random() * 60));
        colorIndex.update((v) => v + 1);
      });
    });

    // Status (DOM reactive)
    yield* reactive(() => [
      p(
        { class: "status" },
        `pos=(${cx()}, ${cy()})  r=${radius()}  color=${color()}  paints=${paintCount}`,
      ),
    ]);
  });

// =============================================================================
// Mount + onFlush auto-repaint
// =============================================================================

const overlay = createDevtoolsOverlay();

const handle = scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createReactivePlugin(),
  overlay.plugin,
]).mount(App);

// Mount DevTools overlay
overlay.connect(handle.hub);
