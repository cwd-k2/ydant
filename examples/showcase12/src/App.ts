import type { Component } from "@ydant/core";
import { div, button, h1, h2, p, span } from "@ydant/base";
import { portal } from "@ydant/portal";

const modalRoot = document.getElementById("modal-root")!;

function openModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.style.display = "flex";
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.style.display = "none";
}

export const App: Component = () =>
  div(function* () {
    yield* h1("Portal Demo");
    yield* p("Click the button to open a modal rendered via portal.");

    yield* p({}, function* () {
      yield* span("The modal escapes this container's ");
      yield* span(
        { style: { fontWeight: "bold", color: "#4f46e5" } },
        "overflow and stacking context",
      );
      yield* span(" because it renders into a separate DOM target.");
    });

    // Button opens the modal
    yield* button({ class: "btn btn-primary", onClick: () => openModal() }, "Open Modal");

    // Render the modal into #modal-root via portal
    yield* portal(modalRoot, () => [
      div(
        {
          class: "modal-overlay",
          id: "modal-overlay",
          style: { display: "none" },
          onClick: (e: Event) => {
            if ((e.target as HTMLElement).id === "modal-overlay") {
              closeModal();
            }
          },
        },
        function* () {
          yield* div({ class: "modal-content" }, function* () {
            yield* h2("Modal Title");
            yield* p({}, function* () {
              yield* span("This modal is rendered via ");
              yield* span(
                {
                  style: {
                    fontFamily: "monospace",
                    background: "#f3f4f6",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  },
                },
                "@ydant/portal",
              );
              yield* span(" into a separate DOM target.");
            });
            yield* p(
              "It lives outside the #app container in the DOM tree, " +
                "but is declared inline with the component logic.",
            );
            yield* button({ class: "btn btn-secondary", onClick: () => closeModal() }, "Close");
          });
        },
      ),
    ]);
  });
