/**
 * @ydant/devtools - Overlay UI
 *
 * A DOM overlay that visualizes Engine lifecycle events in real time.
 * Built with Ydant itself (dogfooding) — the overlay runs in its own
 * mount scope, separate from the application being observed.
 *
 * @example
 * ```typescript
 * const overlay = createDevtoolsOverlay();
 * const handle = scope(createDOMBackend(root), [createBasePlugin(), overlay.plugin])
 *   .mount(App);
 * overlay.connect(handle.hub);
 * ```
 */

import { scope } from "@ydant/core";
import type { Hub, MountHandle } from "@ydant/core";
import { createDOMBackend, createBasePlugin, div, span, text, attr, on } from "@ydant/base";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";
import { createDevtoolsPlugin } from "./plugin";
import type { DevtoolsPlugin } from "./plugin";
import type { DevtoolsEvent } from "./events";

const MAX_VISIBLE_EVENTS = 50;

/** A DevTools overlay handle. */
export interface DevtoolsOverlay {
  /** The DevTools plugin to register in the application's mount. */
  readonly plugin: DevtoolsPlugin;
  /** Connects to the Hub and mounts the overlay UI into `document.body`. */
  connect(hub: Hub): void;
  /** Disposes the overlay UI. */
  dispose(): void;
}

/** Creates a DevTools overlay. */
export function createDevtoolsOverlay(): DevtoolsOverlay {
  // ── Signals (updated from onEvent, read by overlay's reactive blocks) ──
  const recentEvents = signal<readonly DevtoolsEvent[]>([]);
  const visible = signal(false);
  const eventCount = signal(0);

  function pushEvent(event: DevtoolsEvent): void {
    eventCount.update((n) => n + 1);
    recentEvents.update((prev) => {
      const next = [...prev, event];
      return next.length > MAX_VISIBLE_EVENTS ? next.slice(-MAX_VISIBLE_EVENTS) : next;
    });
  }

  // ── Plugin (owned by the overlay, connected via onEvent) ──
  const devtoolsPlugin = createDevtoolsPlugin({ onEvent: pushEvent });

  // ── Overlay UI state ──
  let overlayHandle: MountHandle | undefined;
  let container: HTMLElement | undefined;
  let styleEl: HTMLStyleElement | undefined;

  // ── Overlay Ydant App ──
  const button = (label: string, onClick: () => void) =>
    // Using createHTMLElement would require extra import; inline generator is cleaner
    span(function* () {
      yield* attr("role", "button");
      yield* attr("tabindex", "0");
      yield* attr("class", "yd-dt-btn");
      yield* on("click", onClick);
      yield* text(label);
    });

  const OverlayApp = () =>
    div(function* () {
      yield* attr("class", "yd-dt-root");

      // Toggle button
      yield* div(function* () {
        yield* attr("class", "yd-dt-toggle");
        yield* on("click", () => visible.update((v) => !v));
        yield* reactive(() => [text(`YD ${eventCount()}`)]);
      });

      // Panel (always mounted, visibility controlled by CSS class)
      yield* reactive(() => {
        if (!visible()) return [];
        return [
          div(function* () {
            yield* attr("class", "yd-dt-panel");

            // Header
            yield* div(function* () {
              yield* attr("class", "yd-dt-header");
              yield* span(() => [text("Ydant DevTools")]);
              yield* button("\u00d7", () => visible.set(false));
            });

            // Event log
            yield* div(function* () {
              yield* attr("class", "yd-dt-log");
              yield* reactive(() =>
                recentEvents()
                  .slice()
                  .reverse()
                  .map((e) =>
                    div(function* () {
                      yield* attr("class", `yd-dt-ev yd-dt-ev-${e.type.split(":")[0]}`);
                      yield* span(() => [attr("class", "yd-dt-ev-type"), text(e.type)]);
                      yield* span(() => [attr("class", "yd-dt-ev-id"), text(e.engineId)]);
                    }),
                  ),
              );
            });

            // Controls
            yield* div(function* () {
              yield* attr("class", "yd-dt-controls");
              yield* button("Clear", () => {
                devtoolsPlugin.clearEvents();
                recentEvents.set([]);
                eventCount.set(0);
              });
            });
          }),
        ];
      });
    });

  return {
    plugin: devtoolsPlugin,

    connect(_hub: Hub) {
      if (container) return; // Already connected

      // Inject styles
      styleEl = document.createElement("style");
      styleEl.textContent = OVERLAY_CSS;
      document.head.appendChild(styleEl);

      // Create container
      container = document.createElement("div");
      container.id = "ydant-devtools";
      document.body.appendChild(container);

      // Mount overlay app (separate Ydant scope — no devtools plugin here!)
      overlayHandle = scope(createDOMBackend(container), [
        createBasePlugin(),
        createReactivePlugin(),
      ]).mount(OverlayApp, { scheduler: (flush) => requestAnimationFrame(flush) });
    },

    dispose() {
      overlayHandle?.dispose();
      overlayHandle = undefined;
      container?.remove();
      container = undefined;
      styleEl?.remove();
      styleEl = undefined;
    },
  };
}

// ── Scoped CSS ──
const OVERLAY_CSS = `
#ydant-devtools {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 99999;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  font-size: 12px;
  color: #e0e0e0;
}
.yd-dt-toggle {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  color: #94a3b8;
  font-family: inherit;
  font-size: 11px;
  user-select: none;
}
.yd-dt-toggle:hover { background: #334155; color: #e2e8f0; }
.yd-dt-panel {
  position: absolute;
  bottom: 32px;
  right: 0;
  width: 340px;
  max-height: 360px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.yd-dt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  font-weight: 600;
  font-size: 11px;
  color: #94a3b8;
}
.yd-dt-log {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  max-height: 260px;
}
.yd-dt-ev {
  display: flex;
  gap: 8px;
  padding: 2px 10px;
  border-bottom: 1px solid #1e293b;
}
.yd-dt-ev-type {
  color: #7dd3fc;
  min-width: 100px;
}
.yd-dt-ev-id {
  color: #a78bfa;
}
.yd-dt-ev-flush .yd-dt-ev-type { color: #4ade80; }
.yd-dt-ev-engine .yd-dt-ev-type { color: #fbbf24; }
.yd-dt-ev-task .yd-dt-ev-type { color: #7dd3fc; }
.yd-dt-controls {
  padding: 6px 10px;
  border-top: 1px solid #334155;
  display: flex;
  gap: 6px;
}
.yd-dt-btn {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  color: #94a3b8;
  font-family: inherit;
  font-size: 11px;
}
.yd-dt-btn:hover { background: #334155; color: #e2e8f0; }
`;
