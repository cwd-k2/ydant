import type { Component, Builder, Render } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { refresh, div, h1, h2, p, span, button, cn } from "@ydant/base";
import {
  Transition,
  createTransitionGroupRefresher,
  type TransitionHandle,
} from "@ydant/transition";
import type { Toast } from "./types";

const TOAST_COLORS: Record<Toast["type"], string[]> = {
  success: ["bg-green-500", "text-white"],
  error: ["bg-red-500", "text-white"],
  info: ["bg-blue-500", "text-white"],
};

// Section: Simple toggle with Transition (supports leave animation)
function ToggleSection(): Render {
  let fadeTransition: TransitionHandle;

  const renderSection = function* () {
    yield* button(
      {
        class: cn(
          "px-4",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "hover:bg-blue-600",
          "mb-4",
        ),
        onClick: async () => {
          // Toggle visibility with animation
          const isVisible = (fadeTransition.slot.node as HTMLElement).firstElementChild !== null;
          await fadeTransition.setShow(!isVisible);
        },
      },
      "Toggle Content",
    );

    fadeTransition = yield* Transition({
      enter: "fade-enter",
      enterFrom: "fade-enter-from",
      enterTo: "fade-enter-to",
      leave: "fade-leave",
      leaveFrom: "fade-leave-from",
      leaveTo: "fade-leave-to",
      content: () =>
        div({ class: cn("p-4", "bg-blue-900/30", "rounded-lg") }, function* () {
          yield* p("This content fades in and out!");
          yield* p(
            { class: cn("text-sm", "text-blue-400", "mt-2") },
            "The Transition API handles enter AND leave animations.",
          );
        }),
    });
  };

  return div(function* () {
    yield* h2({ class: cn("text-xl", "font-semibold", "mb-4") }, "Fade Transition");
    yield* div({ class: cn("p-4", "bg-slate-800", "rounded-lg") }, renderSection as Builder);
  });
}

// Section: Slide transition with Transition
function SlideSection(): Render {
  let slideTransition: TransitionHandle;

  const renderSection = function* () {
    yield* button(
      {
        class: cn(
          "px-4",
          "py-2",
          "bg-green-500",
          "text-white",
          "rounded",
          "hover:bg-green-600",
          "mb-4",
        ),
        onClick: async () => {
          const isVisible = (slideTransition.slot.node as HTMLElement).firstElementChild !== null;
          await slideTransition.setShow(!isVisible);
        },
      },
      "Toggle Panel",
    );

    slideTransition = yield* Transition({
      enter: "slide-enter",
      enterFrom: "slide-enter-from",
      enterTo: "slide-enter-to",
      leave: "slide-leave",
      leaveFrom: "slide-leave-from",
      leaveTo: "slide-leave-to",
      content: () =>
        div({ class: cn("p-4", "bg-green-900/30", "rounded-lg") }, "This panel slides in and out!"),
    });
  };

  return div(function* () {
    yield* h2({ class: cn("text-xl", "font-semibold", "mb-4") }, "Slide Transition");
    yield* div({ class: cn("p-4", "bg-slate-800", "rounded-lg") }, renderSection as Builder);
  });
}

// Section: Toast notifications with TransitionGroup
function ToastSection(): Render {
  let toasts: Toast[] = [];
  let nextId = 1;
  let toastListSlot: Slot;

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
      div(
        {
          class: cn(
            "flex",
            "items-center",
            "justify-between",
            "p-3",
            "rounded-lg",
            "shadow",
            ...TOAST_COLORS[toast.type],
          ),
        },
        function* () {
          yield* span(toast.message);
          yield* button(
            {
              class: cn("ml-2", "hover:opacity-75"),
              onClick: () => removeToast(toast.id),
            },
            "×",
          );
        },
      ),
  });

  function updateList() {
    if (toastListSlot) refresher(toastListSlot, toasts);
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
    yield* h2(
      { class: cn("text-xl", "font-semibold", "mb-4") },
      "Toast Notifications (TransitionGroup)",
    );

    yield* div({ class: cn("flex", "gap-2", "mb-4") }, function* () {
      yield* button(
        {
          class: cn("px-4", "py-2", "bg-green-500", "text-white", "rounded", "hover:bg-green-600"),
          onClick: () => addToast("success"),
        },
        "Success Toast",
      );

      yield* button(
        {
          class: cn("px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600"),
          onClick: () => addToast("error"),
        },
        "Error Toast",
      );

      yield* button(
        {
          class: cn("px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600"),
          onClick: () => addToast("info"),
        },
        "Info Toast",
      );
    });

    toastListSlot = yield* div({ class: cn("space-y-2", "min-h-[120px]") });
  });
}

export const App: Component = () =>
  div({ class: "space-y-8" }, function* () {
    // Header
    yield* h1(
      { class: cn("text-2xl", "font-bold", "text-center", "text-purple-300", "mb-2") },
      "CSS Transitions",
    );

    yield* p(
      { class: cn("text-center", "text-gray-400", "text-sm", "mb-6") },
      "Transition for single elements, createTransitionGroupRefresher for lists.",
    );

    // Toggle section (fade)
    yield* ToggleSection();

    // Divider
    yield* div({ class: cn("border-t", "border-slate-700", "my-6") });

    // Slide section
    yield* SlideSection();

    // Divider
    yield* div({ class: cn("border-t", "border-slate-700", "my-6") });

    // Toast section
    yield* ToastSection();

    // Info
    yield* div(
      { class: cn("mt-6", "p-4", "bg-blue-900/30", "rounded-lg", "text-sm") },
      function* () {
        yield* h2({ class: cn("font-semibold", "mb-2") }, "@ydant/transition APIs:");
        yield* p(
          "Transition — returns a handle with setShow(boolean) for single element enter/leave. " +
            "createTransitionGroupRefresher — manages a keyed list with automatic enter/leave per item.",
        );
      },
    );
  });
