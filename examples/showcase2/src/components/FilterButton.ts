import type { Component } from "@ydant/core";
import { button, classes, on, text } from "@ydant/base";

export interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const FilterButton: Component<FilterButtonProps> = (props) => {
  const { label, isActive, onClick } = props;

  return button(() => [
    classes(
      "px-3",
      "py-1",
      "rounded",
      "text-sm",
      "transition-colors",
      ...(isActive
        ? ["bg-blue-500", "text-white"]
        : ["bg-gray-100", "text-gray-600", "hover:bg-gray-200"]),
    ),
    on("click", onClick),
    text(label),
  ]);
};
