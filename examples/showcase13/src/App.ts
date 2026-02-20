/**
 * Shared component used for both SSR and client-side hydration.
 *
 * The same component definition produces HTML on the server
 * and attaches interactivity on the client.
 */

import type { Component } from "@ydant/core";
import { div, button, h2, p, span, text } from "@ydant/base";

export const App: Component = () =>
  div({ class: "app-content" }, function* () {
    yield* h2("Interactive Counter");

    yield* p(function* () {
      yield* text("Count: ");
      yield* span(
        { id: "count-display", style: { fontWeight: "bold", fontSize: "1.2em", color: "#4f46e5" } },
        "0",
      );
    });

    yield* div({ style: { display: "flex", gap: "8px" } }, function* () {
      yield* button(
        {
          class: "btn btn-primary",
          id: "btn-increment",
          onClick: () => {
            updateCount(1);
            log("Increment clicked");
          },
        },
        "+1",
      );

      yield* button(
        {
          class: "btn btn-secondary",
          id: "btn-decrement",
          onClick: () => {
            updateCount(-1);
            log("Decrement clicked");
          },
        },
        "-1",
      );

      yield* button(
        {
          class: "btn btn-secondary",
          id: "btn-reset",
          onClick: () => {
            resetCount();
            log("Reset clicked");
          },
        },
        "Reset",
      );
    });

    yield* p(
      { style: { marginTop: "12px", fontSize: "0.9em", color: "#6b7280" } },
      "This UI was rendered on the server. Buttons became interactive after hydration.",
    );
  });

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
