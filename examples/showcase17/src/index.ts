/**
 * Showcase 17 — Master-Detail with Inter-Engine Messaging
 *
 * hub.dispatch() + engine.on() による DOM ↔ Canvas 間通信。
 *
 * Validates:
 * - hub.dispatch(canvasEngine, msg) — DOM → Canvas メッセージ
 * - engine.on("color:select", handler) — Canvas 側メッセージ受信
 * - hub.dispatch(primaryEngine, msg) — Canvas → DOM 逆方向通信
 * - hub.get("primary") — Engine ID による参照取得
 * - engine.onFlush() — paint + stats dispatch
 */

import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin, createHTMLElement, html } from "@ydant/base";
import { createCanvasBackend, createCanvasPlugin } from "@ydant/canvas";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";

import { ColorList, setEngineRefs } from "./ColorList";
import { Visualization, registerHandlers } from "./Visualization";
import { messageLog, appendLog } from "./palette";

const { div, h1, p, span } = html;
const canvas = createHTMLElement("canvas");

// =============================================================================
// Canvas scope
// =============================================================================

const canvasBackend = createCanvasBackend();
const canvasBuilder = scope(canvasBackend, [
  createBasePlugin(),
  createCanvasPlugin(),
  createReactivePlugin(),
]);

// Stats signal (updated from Canvas engine → DOM via dispatch)
const shapeCount = signal(0);
const paintTime = signal(0);

// =============================================================================
// DOM App
// =============================================================================

const App = () =>
  div(function* () {
    yield* h1("Master-Detail Messaging");
    yield* p(
      { class: "subtitle" },
      "DOM \u2194 Canvas communication via hub.dispatch() + engine.on()",
    );

    yield* div({ class: "layout" }, function* () {
      // Left: DOM color list
      yield* div({ class: "panel" }, function* () {
        yield* ColorList();
      });

      // Right: Canvas visualization
      yield* div({ class: "panel" }, function* () {
        yield* div({ class: "panel-title" }, "Visualization");

        const slot = yield* canvas({ width: "560", height: "360" });
        const ctx2d = (slot.node as HTMLCanvasElement).getContext("2d")!;

        // Embed Canvas scope
        const canvasEngine = yield* canvasBuilder.embed(Visualization);

        // Register message handlers on canvas engine
        registerHandlers(canvasEngine);

        // Auto-repaint + stats dispatch
        canvasEngine.onFlush(() => {
          const start = performance.now();
          canvasBackend.paint(ctx2d);
          const elapsed = performance.now() - start;
          paintTime.set(Math.round(elapsed * 100) / 100);

          // Count shapes in VShape tree
          let count = 0;
          const walk = (children: unknown[]) => {
            for (const c of children) {
              count++;
              const shape = c as { children?: unknown[] };
              if (shape.children) walk(shape.children);
            }
          };
          walk(canvasBackend.root.children as unknown[]);
          shapeCount.set(count);

          // Send stats back to DOM via dispatch
          const primaryEngine = canvasEngine.hub.get("primary");
          if (primaryEngine) {
            canvasEngine.hub.dispatch(primaryEngine, {
              type: "render:stats",
              shapeCount: count,
              paintTime: elapsed,
            });
          }
        });

        // Initial paint
        canvasBackend.paint(ctx2d);

        // Provide engine refs to ColorList for dispatch
        setEngineRefs(canvasEngine, canvasEngine.hub);

        // Stats
        yield* reactive(() => [
          div({ class: "stats" }, `Shapes: ${shapeCount()} | Paint: ${paintTime()}ms`),
        ]);
      });

      // Bottom: Message log
      yield* div({ class: "panel msg-log" }, function* () {
        yield* div({ class: "panel-title" }, "Message Log");

        yield* reactive(() =>
          messageLog()
            .slice()
            .reverse()
            .map((entry) =>
              div({ class: "msg-entry" }, function* () {
                yield* span(
                  {
                    class: `msg-dir ${entry.direction === "dom" ? "msg-dir-dom" : "msg-dir-canvas"}`,
                  },
                  entry.direction === "dom" ? "DOM \u2192 Canvas" : "Canvas \u2192 DOM",
                );
                yield* span({ class: "msg-type" }, entry.type);
                yield* span({ class: "msg-payload" }, entry.payload);
              }),
            ),
        );
      });
    });
  });

// =============================================================================
// Mount
// =============================================================================

const handle = scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createReactivePlugin(),
]).mount(App);

// Listen for stats messages from Canvas engine on the primary engine
for (const engine of handle.hub.engines()) {
  if (engine.id === "primary") {
    engine.on("render:stats", (msg) => {
      appendLog({
        direction: "canvas",
        type: "render:stats",
        payload: `shapes=${msg.shapeCount}, paint=${(msg.paintTime as number).toFixed(2)}ms`,
      });
    });
  }
}
