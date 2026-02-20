import type { Component } from "@ydant/core";
import { button } from "@ydant/base";
import type { TimerMode } from "../types";
import { MODE_LABELS, MODE_COLORS } from "../constants";

export interface ModeButtonProps {
  mode: TimerMode;
  isActive: boolean;
  onClick: () => void;
}

export const ModeButton: Component<ModeButtonProps> = (props) => {
  const { mode, isActive, onClick } = props;

  const colors = MODE_COLORS[mode];

  return button(
    {
      class: `px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive ? `${colors.bg} text-white shadow-lg` : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`,
      onClick,
    },
    MODE_LABELS[mode],
  );
};
