/**
 * Showcase 15 — Multi-Target Dashboard
 *
 * 3 つのレンダリングターゲット（DOM / Canvas / SSR）が
 * 異なる Scheduler で同一 Hub 下に共存する。
 *
 * Validates:
 * - scope().embed() × 2 (Canvas + SSR)
 * - 3 Scheduler 共存: DOM=microtask, Canvas=animFrame, SSR=sync
 * - engine.onFlush() で Canvas paint + SSR toHTML()
 * - DevTools overlay で 3 Engine 観測
 */

import { scope } from "@ydant/core";
import { createDevtoolsOverlay } from "@ydant/devtools";
import { createDOMBackend, createBasePlugin, createHTMLElement, html, text } from "@ydant/base";
import { createCanvasBackend, createCanvasPlugin } from "@ydant/canvas";
import { createSSRBackend } from "@ydant/ssr";
import { reactive, createReactivePlugin } from "@ydant/reactive";

import { Chart } from "./Chart";
import { Preview } from "./Preview";
import {
  dataPoints,
  chartTitle,
  showGrid,
  htmlPreview,
  domFlushCount,
  canvasFlushCount,
  ssrFlushCount,
  randomizeData,
  addBar,
  removeBar,
} from "./signals";

const { div, h1, p, button: btn, ul, li, span } = html;
const canvas = createHTMLElement("canvas");
const pre = createHTMLElement("pre");

// =============================================================================
// Canvas scope (animFrame scheduler)
// =============================================================================

const canvasBackend = createCanvasBackend();
const canvasBuilder = scope(canvasBackend, [
  createBasePlugin(),
  createCanvasPlugin(),
  createReactivePlugin(),
]);

// =============================================================================
// SSR scope (sync scheduler — immediate flush)
// =============================================================================

const ssrBackend = createSSRBackend();
const ssrBuilder = scope(ssrBackend, [createBasePlugin(), createReactivePlugin()]);

// =============================================================================
// DOM App
// =============================================================================

let canvasCtx2d: CanvasRenderingContext2D;

const App = () =>
  div(function* () {
    yield* h1("Multi-Target Dashboard");
    yield* p(
      { class: "subtitle" },
      "DOM (microtask) + Canvas (animFrame) + SSR (sync) — 3 Engines, 1 Hub",
    );

    yield* div({ class: "dashboard" }, function* () {
      // ── Left panel: DOM Controls ──
      yield* div({ class: "panel" }, function* () {
        yield* div({ class: "panel-title" }, function* () {
          yield* span({ class: "badge badge-dom" }, "DOM");
          yield* text(" Controls");
        });

        // Data list (reactive)
        yield* reactive(() => [
          ul({ class: "data-list" }, function* () {
            for (const dp of dataPoints()) {
              yield* li(function* () {
                yield* span({ class: "label" }, dp.label);
                yield* span({ class: "value" }, String(dp.value));
              });
            }
          }),
        ]);

        // Controls
        yield* div({ class: "controls" }, function* () {
          yield* btn({ onClick: randomizeData }, "Randomize");
          yield* btn({ onClick: addBar }, "+ Bar");
          yield* btn({ onClick: removeBar }, "- Bar");
          yield* btn({ onClick: () => showGrid.update((v) => !v) }, "Toggle Grid");
          yield* btn(
            {
              onClick: () => {
                const titles = ["Dashboard", "Sales Q4", "Analytics", "Metrics"];
                const current = chartTitle();
                const idx = (titles.indexOf(current) + 1) % titles.length;
                chartTitle.set(titles[idx]);
              },
            },
            "Change Title",
          );
        });
      });

      // ── Center panel: Canvas Chart ──
      yield* div({ class: "panel" }, function* () {
        yield* div({ class: "panel-title" }, function* () {
          yield* span({ class: "badge badge-canvas" }, "Canvas");
          yield* text(" Bar Chart");
        });

        const slot = yield* canvas({ width: "360", height: "240" });
        canvasCtx2d = (slot.node as HTMLCanvasElement).getContext("2d")!;

        // Embed Canvas scope
        const canvasEngine = yield* canvasBuilder.embed(Chart);

        // Auto-repaint on flush
        canvasEngine.onFlush(() => {
          canvasFlushCount.update((n) => n + 1);
          canvasBackend.paint(canvasCtx2d);
        });

        // Initial paint
        canvasBackend.paint(canvasCtx2d);
      });

      // ── Right panel: SSR Preview ──
      yield* div({ class: "panel" }, function* () {
        yield* div({ class: "panel-title" }, function* () {
          yield* span({ class: "badge badge-ssr" }, "SSR");
          yield* text(" HTML Preview");
        });

        // Embed SSR scope (sync — flushes immediately)
        const ssrEngine = yield* ssrBuilder.embed(Preview);

        // On flush, serialize to HTML and push to signal
        ssrEngine.onFlush(() => {
          ssrFlushCount.update((n) => n + 1);
          htmlPreview.set(ssrBackend.toHTML());
        });

        // Initial serialization
        htmlPreview.set(ssrBackend.toHTML());

        // Reactive HTML preview display
        yield* reactive(() => [pre({ class: "html-preview" }, htmlPreview())]);
      });
    });

    // ── Status bar ──
    yield* reactive(() => [
      p(
        { class: "status" },
        `DOM flush: ${domFlushCount()} | Canvas flush: ${canvasFlushCount()} | SSR flush: ${ssrFlushCount()} | Bars: ${dataPoints().length}`,
      ),
    ]);
  });

// =============================================================================
// Mount
// =============================================================================

const overlay = createDevtoolsOverlay();

const handle = scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createReactivePlugin(),
  overlay.plugin,
]).mount(App);

// Track DOM flushes
for (const engine of handle.hub.engines()) {
  if (engine.id === "primary") {
    engine.onFlush(() => domFlushCount.update((n) => n + 1));
  }
}

overlay.connect(handle.hub);
