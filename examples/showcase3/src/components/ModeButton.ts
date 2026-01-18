import { button, clss, on, text, compose } from "@ydant/core";
import type { TimerMode } from "../types";
import { MODE_LABELS, MODE_COLORS } from "../constants";

export interface ModeButtonProps {
  mode: TimerMode;
  isActive: boolean;
  onClick: () => void;
}

export const ModeButton = compose<ModeButtonProps>(function* (inject) {
  const mode = yield* inject("mode");
  const isActive = yield* inject("isActive");
  const onClick = yield* inject("onClick");

  const colors = MODE_COLORS[mode];

  return button(() => [
    clss([
      "px-4",
      "py-2",
      "rounded-full",
      "text-sm",
      "font-medium",
      "transition-all",
      ...(isActive
        ? [colors.bg, "text-white", "shadow-lg"]
        : ["bg-gray-100", "text-gray-600", "hover:bg-gray-200"]),
    ]),
    on("click", onClick),
    text(MODE_LABELS[mode]),
  ]);
});
