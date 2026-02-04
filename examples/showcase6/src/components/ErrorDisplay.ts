import { div, h3, p, button, text, classes, on } from "@ydant/base";

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorDisplay(props: ErrorDisplayProps) {
  const { error, onRetry } = props;

  return div(function* () {
    yield* classes("p-6", "bg-red-50", "border", "border-red-200", "rounded-lg");
    yield* h3(() => [classes("text-red-800", "font-semibold", "mb-2"), text("Error Occurred")]);
    yield* p(() => [classes("text-red-600", "text-sm", "mb-4"), text(error.message)]);

    if (onRetry) {
      yield* button(function* () {
        yield* classes("px-4", "py-2", "bg-red-500", "text-white", "rounded", "hover:bg-red-600");
        yield* on("click", onRetry);
        yield* text("Retry");
      });
    }
  });
}
