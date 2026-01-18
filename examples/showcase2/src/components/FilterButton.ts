import { button, clss, on, text } from "@ydant/core";

export interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function FilterButton(props: FilterButtonProps) {
  const { label, isActive, onClick } = props;

  return button(() => [
    clss([
      "px-3",
      "py-1",
      "rounded",
      "text-sm",
      "transition-colors",
      ...(isActive
        ? ["bg-blue-500", "text-white"]
        : ["bg-gray-100", "text-gray-600", "hover:bg-gray-200"]),
    ]),
    on("click", onClick),
    text(label),
  ]);
}
