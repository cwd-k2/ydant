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
import {
  createDOMBackend,
  createBasePlugin,
  createHTMLElement,
  div,
  h1,
  p,
  text,
  attr,
  on,
} from "@ydant/base";
import {
  createCanvasBackend,
  createCanvasPlugin,
  group,
  rect,
  circle,
  canvasText,
} from "@ydant/canvas";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";

const canvas = createHTMLElement("canvas");
const button = createHTMLElement("button");

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
      yield* rect(() => [
        attr("x", String(x)),
        attr("y", "0"),
        attr("width", "1"),
        attr("height", "400"),
        attr("fill", "#1a3a5c"),
      ]);
    }
    for (let y = 0; y <= 400; y += 50) {
      yield* rect(() => [
        attr("x", "0"),
        attr("y", String(y)),
        attr("width", "600"),
        attr("height", "1"),
        attr("fill", "#1a3a5c"),
      ]);
    }

    // Reactive shape — tracks cx, cy, radius, colorIndex signals
    yield* reactive(() => [
      // Shadow
      circle(() => [
        attr("cx", String(cx() + 4)),
        attr("cy", String(cy() + 4)),
        attr("r", String(radius())),
        attr("fill", "rgba(0,0,0,0.3)"),
      ]),
      // Main circle
      circle(() => [
        attr("cx", String(cx())),
        attr("cy", String(cy())),
        attr("r", String(radius())),
        attr("fill", color()),
      ]),
      // Label
      canvasText(() => [
        attr("x", String(cx())),
        attr("y", String(cy() + radius() + 20)),
        attr("content", `(${cx()}, ${cy()}) r=${radius()}`),
        attr("font", "12px monospace"),
        attr("fill", "#aaa"),
        attr("textAlign", "center"),
      ]),
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
  div(function* () {
    yield* attr("class", "container");

    yield* h1(() => [text("Reactive Canvas")]);
    yield* p(() => [
      attr("class", "subtitle"),
      text("Signal changes auto-repaint the Canvas via Engine.onFlush()"),
    ]);

    // Canvas element (DOM)
    const slot = yield* canvas(function* () {
      yield* attr("width", "600");
      yield* attr("height", "400");
    });
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

    yield* div(function* () {
      yield* attr("class", "controls");

      yield* button(function* () {
        yield* on("click", () => cy.update((v) => Math.max(radius(), v - step)));
        yield* text("\u2191");
      });
      yield* button(function* () {
        yield* on("click", () => cx.update((v) => Math.max(radius(), v - step)));
        yield* text("\u2190");
      });
      yield* button(function* () {
        yield* on("click", () => cx.update((v) => Math.min(600 - radius(), v + step)));
        yield* text("\u2192");
      });
      yield* button(function* () {
        yield* on("click", () => cy.update((v) => Math.min(400 - radius(), v + step)));
        yield* text("\u2193");
      });
      yield* button(function* () {
        yield* on("click", () => radius.update((v) => Math.max(10, v - 10)));
        yield* text("\u2212");
      });
      yield* button(function* () {
        yield* on("click", () => radius.update((v) => Math.min(100, v + 10)));
        yield* text("+");
      });
      yield* button(function* () {
        yield* on("click", () => colorIndex.update((v) => v + 1));
        yield* text("Color");
      });
      yield* button(function* () {
        yield* on("click", () => {
          // Change all signals at once — demonstrates batching
          cx.set(100 + Math.floor(Math.random() * 400));
          cy.set(50 + Math.floor(Math.random() * 300));
          radius.set(20 + Math.floor(Math.random() * 60));
          colorIndex.update((v) => v + 1);
        });
        yield* text("Randomize");
      });
    });

    // Status (DOM reactive)
    yield* reactive(() => [
      p(() => [
        attr("class", "status"),
        text(`pos=(${cx()}, ${cy()})  r=${radius()}  color=${color()}  paints=${paintCount}`),
      ]),
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
