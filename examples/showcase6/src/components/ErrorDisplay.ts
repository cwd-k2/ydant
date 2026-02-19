import type { Component } from "@ydant/core";
import { div, h3, p, button, text, classes, on } from "@ydant/base";

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorDisplay: Component<ErrorDisplayProps> = (props) => {
  const { error, onRetry } = props;

  return div(function* () {
    yield* classes("p-6", "bg-red-900/30", "border", "border-red-700", "rounded-lg");
    yield* h3(() => [classes("text-red-300", "font-semibold", "mb-2"), text("Error Occurred")]);
    yield* p(() => [classes("text-red-400", "text-sm", "mb-4"), text(error.message)]);

    if (onRetry) {
      yield* button(function* () {
        yield* classes("px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600");
        yield* on("click", onRetry);
        yield* text("Retry");
      });
    }
  });
};
