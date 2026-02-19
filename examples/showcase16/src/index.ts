/**
 * Showcase 16 — Priority-Based Rendering
 *
 * pause()/resume() による優先度スケジューリング + フレーム予算モニタリング。
 *
 * Validates:
 * - engine.pause() / engine.resume() — 低優先 Engine の動的制御
 * - engine.paused — 状態読み取り
 * - engine.onBeforeFlush() — flush 開始時刻記録
 * - engine.onFlush() — flush 所要時間計測 + Canvas paint
 * - DevTools plugin でイベント観測
 */

import type { Engine } from "@ydant/core";
import { scope } from "@ydant/core";
import { createDevtoolsOverlay } from "@ydant/devtools";
import { createDOMBackend, createBasePlugin, createHTMLElement, html, text } from "@ydant/base";
import { createCanvasBackend, createCanvasPlugin } from "@ydant/canvas";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";

import { HighScene } from "./HighScene";
import { LowScene } from "./LowScene";
import { tickHigh, tickLow } from "./particles";

const { div, h1, p, span, label } = html;
const canvas = createHTMLElement("canvas");

// =============================================================================
// Stats signals
// =============================================================================

const frameBudget = signal(12); // ms
const highFlushTime = signal(0);
const lowFlushTime = signal(0);
const pauseCount = signal(0);
const lowPaused = signal(false);
const running = signal(true);

// =============================================================================
// Canvas scopes
// =============================================================================

const highBackend = createCanvasBackend();
const highBuilder = scope(highBackend, [
  createBasePlugin(),
  createCanvasPlugin(),
  createReactivePlugin(),
]);

const lowBackend = createCanvasBackend();
const lowBuilder = scope(lowBackend, [
  createBasePlugin(),
  createCanvasPlugin(),
  createReactivePlugin(),
]);

// =============================================================================
// DOM App
// =============================================================================

let highCtx2d: CanvasRenderingContext2D;
let lowCtx2d: CanvasRenderingContext2D;
let highEngine: Engine;
let lowEngine: Engine;

const App = () =>
  div(function* () {
    yield* h1("Priority-Based Rendering");
    yield* p(
      { classes: ["subtitle"] },
      "pause()/resume() for frame budget management \u2014 low priority pauses when overloaded",
    );

    // Top controls
    yield* div({ classes: ["top-controls"] }, function* () {
      yield* label(function* () {
        yield* text("Frame Budget: ");
        yield* reactive(() => [span(String(frameBudget()) + "ms")]);
      });
      yield* html.input({
        type: "range",
        min: "2",
        max: "30",
        value: "12",
        onInput: (e: Event) => {
          frameBudget.set(Number((e.target as HTMLInputElement).value));
        },
      });
      yield* html.button({ onClick: () => running.update((v) => !v) }, function* () {
        yield* reactive(() => [text(running() ? "Pause All" : "Resume All")]);
      });
    });

    // Canvases
    yield* div({ classes: ["canvases"] }, function* () {
      // High priority
      yield* div({ classes: ["canvas-panel"] }, function* () {
        yield* div({ classes: ["panel-title"] }, function* () {
          yield* span({ classes: ["badge", "badge-high"] }, "HIGH");
          yield* text(" Priority \u2014 Always Active");
        });

        const highSlot = yield* canvas({ width: "430", height: "300" });
        highCtx2d = (highSlot.node as HTMLCanvasElement).getContext("2d")!;

        highEngine = yield* highBuilder.embed(HighScene);

        let flushStart = 0;
        highEngine.onBeforeFlush(() => {
          flushStart = performance.now();
        });
        highEngine.onFlush(() => {
          highFlushTime.set(Math.round((performance.now() - flushStart) * 100) / 100);
          highBackend.paint(highCtx2d);
        });

        highBackend.paint(highCtx2d);
      });

      // Low priority
      yield* div({ classes: ["canvas-panel"] }, function* () {
        yield* div({ classes: ["panel-title"] }, function* () {
          yield* span({ classes: ["badge", "badge-low"] }, "LOW");
          yield* text(" Priority \u2014 ");
          yield* reactive(() => [
            span(
              { classes: lowPaused() ? ["badge", "badge-paused"] : [] },
              lowPaused() ? "PAUSED" : "Active",
            ),
          ]);
        });

        const lowSlot = yield* canvas({ width: "430", height: "300" });
        lowCtx2d = (lowSlot.node as HTMLCanvasElement).getContext("2d")!;

        lowEngine = yield* lowBuilder.embed(LowScene);

        let flushStart = 0;
        lowEngine.onBeforeFlush(() => {
          flushStart = performance.now();
        });
        lowEngine.onFlush(() => {
          lowFlushTime.set(Math.round((performance.now() - flushStart) * 100) / 100);
          lowBackend.paint(lowCtx2d);
        });

        lowBackend.paint(lowCtx2d);
      });
    });

    // Stats
    yield* div({ classes: ["stats-bar"] }, function* () {
      yield* div({ classes: ["stat-card"] }, function* () {
        yield* div({ classes: ["stat-label"] }, "High Flush");
        yield* reactive(() => [div({ classes: ["stat-value", "high"] }, `${highFlushTime()}ms`)]);
      });
      yield* div({ classes: ["stat-card"] }, function* () {
        yield* div({ classes: ["stat-label"] }, "Low Flush");
        yield* reactive(() => [div({ classes: ["stat-value", "low"] }, `${lowFlushTime()}ms`)]);
      });
      yield* div({ classes: ["stat-card"] }, function* () {
        yield* div({ classes: ["stat-label"] }, "Budget");
        yield* reactive(() => [div({ classes: ["stat-value", "budget"] }, `${frameBudget()}ms`)]);
      });
      yield* div({ classes: ["stat-card"] }, function* () {
        yield* div({ classes: ["stat-label"] }, "Pauses");
        yield* reactive(() => [div({ classes: ["stat-value", "paused"] }, String(pauseCount()))]);
      });
    });
  });

// =============================================================================
// Mount + Animation loop
// =============================================================================

const overlay = createDevtoolsOverlay();

const handle = scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createReactivePlugin(),
  overlay.plugin,
]).mount(App);

overlay.connect(handle.hub);

// Animation loop with priority control
let lastTime = 0;

function loop(now: number) {
  if (!running()) {
    requestAnimationFrame(loop);
    return;
  }

  const dt = now - lastTime;
  lastTime = now;

  // Always update high priority
  tickHigh();

  // Priority control for low engine
  const budget = frameBudget();

  if (dt > budget && !lowEngine.paused) {
    lowEngine.pause();
    lowPaused.set(true);
    pauseCount.update((n) => n + 1);
  } else if (dt < budget * 0.7 && lowEngine.paused) {
    lowEngine.resume();
    lowPaused.set(false);
  }

  // Update low particles only if not paused
  if (!lowEngine.paused) {
    tickLow();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame((now) => {
  lastTime = now;
  requestAnimationFrame(loop);
});
