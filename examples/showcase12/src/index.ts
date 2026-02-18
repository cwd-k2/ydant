/**
 * Showcase 12 — Portal for Modal Dialogs
 *
 * Demonstrates @ydant/portal: renders content to a different DOM target,
 * escaping the parent's overflow and stacking context.
 * The modal is rendered into #modal-root while the trigger stays in #app.
 */

import { scope, type Component } from "@ydant/core";
import {
  createDOMBackend,
  createBasePlugin,
  div,
  button,
  h1,
  h2,
  p,
  span,
  attr,
  on,
  text,
  style,
} from "@ydant/base";
import { createPortalPlugin, portal } from "@ydant/portal";

const modalRoot = document.getElementById("modal-root")!;

function openModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.style.display = "flex";
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.style.display = "none";
}

const App: Component = () =>
  div(() => [
    h1(() => [text("Portal Demo")]),
    p(() => [text("Click the button to open a modal rendered via portal.")]),

    p(() => [
      text("The modal escapes this container's "),
      span(() => [
        style({ fontWeight: "bold", color: "#4f46e5" }),
        text("overflow and stacking context"),
      ]),
      text(" because it renders into a separate DOM target."),
    ]),

    // Button opens the modal
    button(() => [
      attr("class", "btn btn-primary"),
      on("click", () => openModal()),
      text("Open Modal"),
    ]),

    // Render the modal into #modal-root via portal
    portal(modalRoot, () => [
      div(() => [
        attr("class", "modal-overlay"),
        attr("id", "modal-overlay"),
        style({ display: "none" }),
        on("click", (e) => {
          if ((e.target as HTMLElement).id === "modal-overlay") {
            closeModal();
          }
        }),
        div(() => [
          attr("class", "modal-content"),
          h2(() => [text("Modal Title")]),
          p(() => [
            text("This modal is rendered via "),
            span(() => [
              style({
                fontFamily: "monospace",
                background: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: "4px",
              }),
              text("@ydant/portal"),
            ]),
            text(" into a separate DOM target."),
          ]),
          p(() => [
            text("It lives outside the #app container in the DOM tree, "),
            text("but is declared inline with the component logic."),
          ]),
          button(() => [
            attr("class", "btn btn-secondary"),
            on("click", () => closeModal()),
            text("Close"),
          ]),
        ]),
      ]),
    ]),
  ]);

scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createPortalPlugin(),
]).mount(App);
