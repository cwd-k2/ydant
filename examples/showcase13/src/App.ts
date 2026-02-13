/**
 * Shared component used for both SSR and client-side hydration.
 *
 * The same component definition produces HTML on the server
 * and attaches interactivity on the client.
 */

import type { Component } from "@ydant/core";
import { div, button, h2, p, span, attr, on, text, style } from "@ydant/base";

export const App: Component = () =>
  div(() => [
    attr("class", "app-content"),

    h2(() => [text("Interactive Counter")]),

    p(() => [
      text("Count: "),
      span(() => [
        attr("id", "count-display"),
        style({ fontWeight: "bold", fontSize: "1.2em", color: "#4f46e5" }),
        text("0"),
      ]),
    ]),

    div(() => [
      style({ display: "flex", gap: "8px" }),

      button(() => [
        attr("class", "btn btn-primary"),
        attr("id", "btn-increment"),
        on("click", () => {
          updateCount(1);
          log("Increment clicked");
        }),
        text("+1"),
      ]),

      button(() => [
        attr("class", "btn btn-secondary"),
        attr("id", "btn-decrement"),
        on("click", () => {
          updateCount(-1);
          log("Decrement clicked");
        }),
        text("-1"),
      ]),

      button(() => [
        attr("class", "btn btn-secondary"),
        attr("id", "btn-reset"),
        on("click", () => {
          resetCount();
          log("Reset clicked");
        }),
        text("Reset"),
      ]),
    ]),

    p(() => [
      style({ marginTop: "12px", fontSize: "0.9em", color: "#6b7280" }),
      text("This UI was rendered on the server. Buttons became interactive after hydration."),
    ]),
  ]);

// Client-side state (only active after hydration)
let count = 0;

function updateCount(delta: number) {
  count += delta;
  const el = document.getElementById("count-display");
  if (el) el.textContent = String(count);
}

function resetCount() {
  count = 0;
  const el = document.getElementById("count-display");
  if (el) el.textContent = "0";
}

function log(message: string) {
  const logEl = document.getElementById("log");
  if (logEl) {
    const entry = document.createElement("div");
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.prepend(entry);
  }
}
