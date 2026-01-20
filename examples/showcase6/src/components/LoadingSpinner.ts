import { div, span, text, clss } from "@ydant/core";

export function LoadingSpinner(message = "Loading...") {
  return div(() => [
    clss(["flex", "flex-col", "items-center", "justify-center", "p-8"]),
    div(() => [
      clss([
        "spinner",
        "w-8",
        "h-8",
        "border-4",
        "border-blue-500",
        "border-t-transparent",
        "rounded-full",
        "mb-4",
      ]),
    ]),
    span(() => [clss(["text-gray-500"]), text(message)]),
  ]);
}
