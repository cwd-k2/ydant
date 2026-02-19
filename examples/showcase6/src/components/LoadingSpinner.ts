import type { Render } from "@ydant/core";
import { div, span, text, classes } from "@ydant/base";

export function LoadingSpinner(message = "Loading..."): Render {
  return div(() => [
    classes("flex", "flex-col", "items-center", "justify-center", "p-8"),
    div(() => [
      classes(
        "spinner",
        "w-8",
        "h-8",
        "border-4",
        "border-blue-500",
        "border-t-transparent",
        "rounded-full",
        "mb-4",
      ),
    ]),
    span(() => [classes("text-gray-400"), text(message)]),
  ]);
}
