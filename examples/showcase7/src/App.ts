import {
  type Component,
  type Slot,
  div,
  h1,
  h2,
  p,
  span,
  button,
  text,
  clss,
  on,
  key,
} from "@ydant/core";
import { Transition } from "@ydant/transition";
import type { Toast } from "./types";

const TOAST_COLORS: Record<Toast["type"], string[]> = {
  success: ["bg-green-500", "text-white"],
  error: ["bg-red-500", "text-white"],
  info: ["bg-blue-500", "text-white"],
};

// Section: Simple toggle with Transition
function ToggleSection() {
  let isVisible = false;
  let sectionSlot: Slot;

  const renderSection = function* () {
    yield* clss(["p-4", "bg-gray-50", "rounded-lg"]);

    yield* button(function* () {
      yield* clss([
        "px-4",
        "py-2",
        "bg-blue-500",
        "text-white",
        "rounded",
        "hover:bg-blue-600",
        "mb-4",
      ]);
      yield* on("click", () => {
        isVisible = !isVisible;
        sectionSlot.refresh(renderSection);
      });
      yield* text(isVisible ? "Hide Content" : "Show Content");
    });

    yield* Transition({
      show: isVisible,
      enter: "fade-enter",
      enterFrom: "fade-enter-from",
      enterTo: "fade-enter-to",
      leave: "fade-leave",
      leaveFrom: "fade-leave-from",
      leaveTo: "fade-leave-to",
      children: () =>
        div(() => [
          clss(["p-4", "bg-blue-100", "rounded-lg"]),
          p(() => [text("This content fades in and out!")]),
          p(() => [
            clss(["text-sm", "text-blue-600", "mt-2"]),
            text("The Transition component handles the animation."),
          ]),
        ]),
    });
  };

  return div(function* () {
    yield* h2(() => [clss(["text-xl", "font-semibold", "mb-4"]), text("Fade Transition")]);
    sectionSlot = yield* div(renderSection);
  });
}

// Section: Slide transition
function SlideSection() {
  let isVisible = false;
  let sectionSlot: Slot;

  const renderSection = function* () {
    yield* clss(["p-4", "bg-gray-50", "rounded-lg"]);

    yield* button(function* () {
      yield* clss([
        "px-4",
        "py-2",
        "bg-green-500",
        "text-white",
        "rounded",
        "hover:bg-green-600",
        "mb-4",
      ]);
      yield* on("click", () => {
        isVisible = !isVisible;
        sectionSlot.refresh(renderSection);
      });
      yield* text(isVisible ? "Hide Panel" : "Show Panel");
    });

    yield* Transition({
      show: isVisible,
      enter: "slide-enter",
      enterFrom: "slide-enter-from",
      enterTo: "slide-enter-to",
      children: () =>
        div(() => [
          clss(["p-4", "bg-green-100", "rounded-lg"]),
          p(() => [text("This panel slides in from the left!")]),
        ]),
    });
  };

  return div(function* () {
    yield* h2(() => [clss(["text-xl", "font-semibold", "mb-4"]), text("Slide Transition")]);
    sectionSlot = yield* div(renderSection);
  });
}

// Section: Toast notifications (simplified - no TransitionGroup)
function ToastSection() {
  let toasts: Toast[] = [];
  let nextId = 1;
  let toastListSlot: Slot;

  const addToast = (type: Toast["type"]) => {
    const messages: Record<Toast["type"], string> = {
      success: "Operation completed successfully!",
      error: "Something went wrong. Please try again.",
      info: "Here is some useful information.",
    };

    toasts.push({
      id: nextId++,
      message: messages[type],
      type,
    });

    toastListSlot.refresh(renderToastList);

    // Auto-remove after 3 seconds
    const toastId = nextId - 1;
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== toastId);
      toastListSlot.refresh(renderToastList);
    }, 3000);
  };

  const removeToast = (id: number) => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListSlot.refresh(renderToastList);
  };

  const renderToastList = function* () {
    yield* clss(["space-y-2", "min-h-[120px]"]);

    if (toasts.length === 0) {
      yield* div(() => [
        clss(["p-4", "text-center", "text-gray-400", "border", "border-dashed", "rounded-lg"]),
        text("No toasts. Click a button above to add one."),
      ]);
    } else {
      for (const toast of toasts) {
        // Using key for efficient updates
        yield* key(toast.id);

        yield* Transition({
          show: true,
          enter: "scale-enter",
          enterFrom: "scale-enter-from",
          enterTo: "scale-enter-to",
          children: () =>
            div(function* () {
              yield* clss([
                "flex",
                "items-center",
                "justify-between",
                "p-3",
                "rounded-lg",
                "shadow",
                ...TOAST_COLORS[toast.type],
              ]);
              yield* span(() => [text(toast.message)]);
              yield* button(function* () {
                yield* clss(["ml-2", "hover:opacity-75"]);
                yield* on("click", () => removeToast(toast.id));
                yield* text("×");
              });
            }),
        });
      }
    }
  };

  return div(function* () {
    yield* h2(() => [clss(["text-xl", "font-semibold", "mb-4"]), text("Toast Notifications")]);

    yield* div(function* () {
      yield* clss(["flex", "gap-2", "mb-4"]);

      yield* button(function* () {
        yield* clss(["px-4", "py-2", "bg-green-500", "text-white", "rounded", "hover:bg-green-600"]);
        yield* on("click", () => addToast("success"));
        yield* text("Success Toast");
      });

      yield* button(function* () {
        yield* clss(["px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600"]);
        yield* on("click", () => addToast("error"));
        yield* text("Error Toast");
      });

      yield* button(function* () {
        yield* clss(["px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600"]);
        yield* on("click", () => addToast("info"));
        yield* text("Info Toast");
      });
    });

    toastListSlot = yield* div(renderToastList);
  });
}

export const App: Component = () =>
  div(function* () {
    yield* clss(["space-y-8"]);

    // Header
    yield* h1(() => [
      clss(["text-2xl", "font-bold", "text-center", "text-purple-800", "mb-2"]),
      text("CSS Transitions"),
    ]);

    yield* p(() => [
      clss(["text-center", "text-gray-500", "text-sm", "mb-6"]),
      text("Demonstrates Transition component for animated UI elements."),
    ]);

    // Toggle section (fade)
    yield* ToggleSection();

    // Divider
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // Slide section
    yield* SlideSection();

    // Divider
    yield* div(() => [clss(["border-t", "border-gray-200", "my-6"])]);

    // Toast section
    yield* ToastSection();

    // Info
    yield* div(() => [
      clss(["mt-6", "p-4", "bg-blue-50", "rounded-lg", "text-sm"]),
      h2(() => [clss(["font-semibold", "mb-2"]), text("How Transition Works:")]),
      p(() => [
        text(
          "The Transition component applies CSS classes at different stages of enter/leave. " +
            "Combined with CSS transitions, this creates smooth animations."
        ),
      ]),
    ]);
  });
