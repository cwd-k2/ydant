/**
 * Showcase 18 — Collaborative Editing Simulation
 *
 * 複数 Engine の協調動作 — 競合検出 → pause → 解決 → resume。
 *
 * Validates:
 * - DOM-to-DOM embed × 2 (2 つの独立 DOM Backend)
 * - engine.pause() / engine.resume() — 競合時のフロー制御
 * - hub.dispatch() + engine.on("edit:remote") — 編集通知
 * - engine.onError() — Engine 間のエラー隔離
 * - batch() — 複数 signal のアトミック更新
 */

import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin, html, text, attr } from "@ydant/base";
import { reactive, createReactivePlugin } from "@ydant/reactive";

import { Editor } from "./Editor";
import {
  setEngines,
  registerErrorHandlers,
  simulateEdit,
  toggleAutoPlay,
  autoPlaying,
  conflictCount,
  editCount,
  eventLog,
} from "./conflicts";

const { div, h1, p, span } = html;

// =============================================================================
// DOM App
// =============================================================================

const App = () =>
  div(function* () {
    yield* h1("Collaborative Editing");
    yield* p(
      { classes: ["subtitle"] },
      "2 DOM Engines — conflict detection \u2192 pause \u2192 resolve \u2192 resume",
    );

    // Controls
    yield* div({ classes: ["controls"] }, function* () {
      yield* html.button({ onClick: () => simulateEdit("A") }, "Edit as A");
      yield* html.button({ onClick: () => simulateEdit("B") }, "Edit as B");
      yield* html.button({ onClick: toggleAutoPlay }, function* () {
        yield* reactive(() => [text(autoPlaying() ? "Stop Auto-play" : "Start Auto-play")]);
      });
    });

    // Editor panels
    yield* div({ classes: ["editors"] }, function* () {
      // Editor A panel — embed a separate DOM backend
      const slotA = yield* div({ classes: ["editor-panel"] });
      const backendA = createDOMBackend(slotA.node as HTMLElement);
      const builderA = scope(backendA, [createBasePlugin(), createReactivePlugin()]);
      const engineA = yield* builderA.embed(() => Editor({ editor: "A" }));

      // Editor B panel — embed a separate DOM backend
      const slotB = yield* div({ classes: ["editor-panel"] });
      const backendB = createDOMBackend(slotB.node as HTMLElement);
      const builderB = scope(backendB, [createBasePlugin(), createReactivePlugin()]);
      const engineB = yield* builderB.embed(() => Editor({ editor: "B" }));

      // Register engine.on() for edit notifications
      engineA.on("edit:remote", (_msg) => {
        // Editor A receives notification that B edited something
        // (visual effect handled by reactive signals)
      });
      engineB.on("edit:remote", (_msg) => {
        // Editor B receives notification that A edited something
      });

      // Provide engine refs to conflict system
      setEngines(engineA, engineB, engineA.hub);
      registerErrorHandlers();
    });

    // Bottom panels
    yield* div({ classes: ["bottom-panel"] }, function* () {
      // Engine state
      yield* div({ classes: ["status-panel"] }, function* () {
        yield* div({ classes: ["panel-title"] }, "Engine State");
        yield* reactive(() => {
          return [
            div({ classes: ["engine-state"] }, function* () {
              yield* div(function* () {
                yield* span({ classes: ["state-label"] }, "Edits: ");
                yield* span(String(editCount()));
              });
              yield* div(function* () {
                yield* span({ classes: ["state-label"] }, "Conflicts: ");
                yield* span(String(conflictCount()));
              });
              yield* div(function* () {
                yield* span({ classes: ["state-label"] }, "Auto-play: ");
                yield* span(
                  { classes: [autoPlaying() ? "state-active" : "state-paused"] },
                  autoPlaying() ? "ON" : "OFF",
                );
              });
            }),
          ];
        });
      });

      // Event log
      yield* div({ classes: ["log-panel"] }, function* () {
        yield* div({ classes: ["panel-title"] }, "Event Log");
        yield* reactive(() =>
          eventLog()
            .slice()
            .reverse()
            .map((entry) => {
              const isError = entry.includes("ERROR");
              const cls = isError ? "log-entry log-error" : "log-entry";
              return div(function* () {
                yield* attr("class", cls);
                yield* text(entry);
              });
            }),
        );
      });
    });
  });

// =============================================================================
// Mount
// =============================================================================

scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createReactivePlugin(),
]).mount(App);
