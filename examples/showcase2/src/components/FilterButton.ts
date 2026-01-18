import { button, clss, on, text, compose } from "@ydant/core";

export interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const FilterButton = compose<FilterButtonProps>(function* (inject) {
  const label = yield* inject("label");
  const isActive = yield* inject("isActive");
  const onClick = yield* inject("onClick");

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
});
