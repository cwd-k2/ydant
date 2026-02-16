import type { Component, Builder, Render } from "@ydant/core";
import { createSlotRef, div, h1, h2, p, span, button, text, classes, on } from "@ydant/base";
import {
  createTransition,
  createTransitionGroupRefresher,
  type TransitionHandle,
} from "@ydant/transition";
import type { Toast } from "./types";

const TOAST_COLORS: Record<Toast["type"], string[]> = {
  success: ["bg-green-500", "text-white"],
  error: ["bg-red-500", "text-white"],
  info: ["bg-blue-500", "text-white"],
};

// Section: Simple toggle with createTransition (supports leave animation)
function ToggleSection(): Render {
  const sectionRef = createSlotRef();
  let fadeTransition: TransitionHandle;

  const renderSection = function* () {
    yield* classes("p-4", "bg-gray-50", "rounded-lg");

    yield* button(function* () {
      yield* classes(
        "px-4",
        "py-2",
        "bg-blue-500",
        "text-white",
        "rounded",
        "hover:bg-blue-600",
        "mb-4",
      );
      yield* on("click", async () => {
        // Toggle visibility with animation
        const isVisible = (fadeTransition.slot.node as HTMLElement).firstElementChild !== null;
        await fadeTransition.setShow(!isVisible);
      });
      yield* text("Toggle Content");
    });

    fadeTransition = yield* createTransition({
      enter: "fade-enter",
      enterFrom: "fade-enter-from",
      enterTo: "fade-enter-to",
      leave: "fade-leave",
      leaveFrom: "fade-leave-from",
      leaveTo: "fade-leave-to",
      content: () =>
        div(() => [
          classes("p-4", "bg-blue-100", "rounded-lg"),
          p(() => [text("This content fades in and out!")]),
          p(() => [
            classes("text-sm", "text-blue-600", "mt-2"),
            text("The createTransition API handles enter AND leave animations."),
          ]),
        ]),
    });
  };

  return div(function* () {
    yield* h2(() => [classes("text-xl", "font-semibold", "mb-4"), text("Fade Transition")]);
    sectionRef.bind(yield* div(renderSection as Builder));
  });
}

// Section: Slide transition with createTransition
function SlideSection(): Render {
  const sectionRef = createSlotRef();
  let slideTransition: TransitionHandle;

  const renderSection = function* () {
    yield* classes("p-4", "bg-gray-50", "rounded-lg");

    yield* button(function* () {
      yield* classes(
        "px-4",
        "py-2",
        "bg-green-500",
        "text-white",
        "rounded",
        "hover:bg-green-600",
        "mb-4",
      );
      yield* on("click", async () => {
        const isVisible = (slideTransition.slot.node as HTMLElement).firstElementChild !== null;
        await slideTransition.setShow(!isVisible);
      });
      yield* text("Toggle Panel");
    });

    slideTransition = yield* createTransition({
      enter: "slide-enter",
      enterFrom: "slide-enter-from",
      enterTo: "slide-enter-to",
      leave: "slide-leave",
      leaveFrom: "slide-leave-from",
      leaveTo: "slide-leave-to",
      content: () =>
        div(() => [
          classes("p-4", "bg-green-100", "rounded-lg"),
          p(() => [text("This panel slides in and out!")]),
        ]),
    });
  };

  return div(function* () {
    yield* h2(() => [classes("text-xl", "font-semibold", "mb-4"), text("Slide Transition")]);
    sectionRef.bind(yield* div(renderSection as Builder));
  });
}

// Section: Toast notifications with TransitionGroup
function ToastSection(): Render {
  let toasts: Toast[] = [];
  let nextId = 1;
  const toastListRef = createSlotRef();

  // TransitionGroup refresher — handles enter/leave animations per item
  const refresher = createTransitionGroupRefresher<Toast>({
    keyFn: (t) => t.id,
    enter: "scale-enter",
    enterFrom: "scale-enter-from",
    enterTo: "scale-enter-to",
    leave: "scale-leave",
    leaveFrom: "scale-leave-from",
    leaveTo: "scale-leave-to",
    content: (toast) =>
      div(function* () {
        yield* classes(
          "flex",
          "items-center",
          "justify-between",
          "p-3",
          "rounded-lg",
          "shadow",
          ...TOAST_COLORS[toast.type],
        );
        yield* span(() => [text(toast.message)]);
        yield* button(function* () {
          yield* classes("ml-2", "hover:opacity-75");
          yield* on("click", () => removeToast(toast.id));
          yield* text("×");
        });
      }),
  });

  function updateList() {
    const slot = toastListRef.current;
    if (slot) refresher(slot, toasts);
  }

  const addToast = (type: Toast["type"]) => {
    const messages: Record<Toast["type"], string> = {
      success: "Operation completed successfully!",
      error: "Something went wrong. Please try again.",
      info: "Here is some useful information.",
    };

    toasts = [{ id: nextId++, message: messages[type], type }, ...toasts];
    updateList();

    // Auto-remove after 3 seconds
    const toastId = nextId - 1;
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== toastId);
      updateList();
    }, 3000);
  };

  const removeToast = (id: number) => {
    toasts = toasts.filter((t) => t.id !== id);
    updateList();
  };

  return div(function* () {
    yield* h2(() => [
      classes("text-xl", "font-semibold", "mb-4"),
      text("Toast Notifications (TransitionGroup)"),
    ]);

    yield* div(function* () {
      yield* classes("flex", "gap-2", "mb-4");

      yield* button(function* () {
        yield* classes(
          "px-4",
          "py-2",
          "bg-green-500",
          "text-white",
          "rounded",
          "hover:bg-green-600",
        );
        yield* on("click", () => addToast("success"));
        yield* text("Success Toast");
      });

      yield* button(function* () {
        yield* classes("px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600");
        yield* on("click", () => addToast("error"));
        yield* text("Error Toast");
      });

      yield* button(function* () {
        yield* classes("px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600");
        yield* on("click", () => addToast("info"));
        yield* text("Info Toast");
      });
    });

    toastListRef.bind(
      yield* div(function* () {
        yield* classes("space-y-2", "min-h-[120px]");
      }),
    );
  });
}

export const App: Component = () =>
  div(function* () {
    yield* classes("space-y-8");

    // Header
    yield* h1(() => [
      classes("text-2xl", "font-bold", "text-center", "text-purple-800", "mb-2"),
      text("CSS Transitions"),
    ]);

    yield* p(() => [
      classes("text-center", "text-gray-500", "text-sm", "mb-6"),
      text("createTransition for single elements, createTransitionGroupRefresher for lists."),
    ]);

    // Toggle section (fade)
    yield* ToggleSection();

    // Divider
    yield* div(() => [classes("border-t", "border-gray-200", "my-6")]);

    // Slide section
    yield* SlideSection();

    // Divider
    yield* div(() => [classes("border-t", "border-gray-200", "my-6")]);

    // Toast section
    yield* ToastSection();

    // Info
    yield* div(() => [
      classes("mt-6", "p-4", "bg-blue-50", "rounded-lg", "text-sm"),
      h2(() => [classes("font-semibold", "mb-2"), text("@ydant/transition APIs:")]),
      p(() => [
        text(
          "createTransition — returns a handle with setShow(boolean) for single element enter/leave. " +
            "createTransitionGroupRefresher — manages a keyed list with automatic enter/leave per item.",
        ),
      ]),
    ]);
  });
