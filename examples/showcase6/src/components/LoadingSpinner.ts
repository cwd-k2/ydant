import type { Render } from "@ydant/core";
import { div, span, cn } from "@ydant/base";

export function LoadingSpinner(message = "Loading..."): Render {
  return div(
    { class: cn("flex", "flex-col", "items-center", "justify-center", "p-8") },
    function* () {
      yield* div({
        class: cn(
          "spinner",
          "w-8",
          "h-8",
          "border-4",
          "border-blue-500",
          "border-t-transparent",
          "rounded-full",
          "mb-4",
        ),
      });
      yield* span({ class: "text-gray-400" }, message);
    },
  );
}
