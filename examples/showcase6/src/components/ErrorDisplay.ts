import type { Component } from "@ydant/core";
import { div, h3, p, button, cn } from "@ydant/base";

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorDisplay: Component<ErrorDisplayProps> = (props) => {
  const { error, onRetry } = props;

  return div(
    { class: cn("p-6", "bg-red-900/30", "border", "border-red-700", "rounded-lg") },
    function* () {
      yield* h3({ class: cn("text-red-300", "font-semibold", "mb-2") }, "Error Occurred");
      yield* p({ class: cn("text-red-400", "text-sm", "mb-4") }, error.message);

      if (onRetry) {
        yield* button(
          {
            class: cn("px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600"),
            onClick: onRetry,
          },
          "Retry",
        );
      }
    },
  );
};
