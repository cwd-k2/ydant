import type { Component } from "@ydant/core";
import { button } from "@ydant/base";

export interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const FilterButton: Component<FilterButtonProps> = (props) => {
  const { label, isActive, onClick } = props;

  return button(
    {
      class: `px-3 py-1 rounded text-sm transition-colors ${isActive ? "bg-blue-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"}`,
      onClick,
    },
    label,
  );
};
