/**
 * Showcase 13 — SSR + Hydration
 *
 * Demonstrates the full SSR → Hydration flow:
 * 1. renderToString() generates HTML on the "server" side
 * 2. The HTML is injected into the DOM (simulating server response)
 * 3. hydrate() walks the existing DOM and attaches event listeners
 *
 * The same App component is used for both phases,
 * proving that the component definition is truly universal.
 */

import { renderToString, hydrate } from "@ydant/ssr";
import { App } from "./App";

// --- Phase 1: SSR ---
const html = renderToString(App);

// Show the raw HTML string
const ssrOutput = document.getElementById("ssr-output")!;
ssrOutput.textContent = html;

// --- Phase 2: Inject HTML into DOM (simulating server response) ---
const appEl = document.getElementById("app")!;
appEl.innerHTML = html;

// --- Phase 3: Hydrate ---
// Wait for next frame to ensure DOM is fully rendered before hydrating
requestAnimationFrame(() => {
  hydrate(App, appEl);

  const status = document.getElementById("hydration-status")!;
  status.textContent = "hydrate() 完了 — ボタンがインタラクティブになりました。";
  status.style.color = "#15803d";
  status.style.fontWeight = "bold";

  const logEl = document.getElementById("log")!;
  const entry = document.createElement("div");
  entry.textContent = `[${new Date().toLocaleTimeString()}] Hydration complete. Event listeners attached.`;
  logEl.prepend(entry);
});
