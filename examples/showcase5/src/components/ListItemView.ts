import type { Component } from "@ydant/core";
import { div, span, button, cn } from "@ydant/base";
import type { ListItem } from "../types";

const PRIORITY_COLORS: Record<ListItem["priority"], string[]> = {
  high: ["bg-red-900/30", "text-red-300", "border-red-700"],
  medium: ["bg-yellow-900/30", "text-yellow-300", "border-yellow-700"],
  low: ["bg-green-900/30", "text-green-300", "border-green-700"],
};

const PRIORITY_LABELS: Record<ListItem["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface ListItemViewProps {
  item: ListItem;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const ListItemView: Component<ListItemViewProps> = (props) => {
  const { item, onMoveUp, onMoveDown, onDelete, isFirst, isLast } = props;

  return div(
    {
      class: cn(
        "list-item",
        "flex",
        "items-center",
        "gap-3",
        "p-3",
        "border",
        "rounded-lg",
        "mb-2",
        ...PRIORITY_COLORS[item.priority],
      ),
    },
    function* () {
      // Priority badge
      yield* span(
        { class: cn("text-xs", "font-medium", "px-2", "py-1", "rounded") },
        PRIORITY_LABELS[item.priority],
      );

      // Item text
      yield* span({ class: cn("flex-1", "font-medium") }, item.text);

      // Item ID (for debugging key behavior)
      yield* span({ class: cn("text-xs", "text-gray-400") }, `#${item.id}`);

      // Move buttons
      yield* div({ class: cn("flex", "gap-1") }, function* () {
        yield* button(
          {
            class: cn(
              "px-2",
              "py-1",
              "text-sm",
              "bg-slate-700",
              "rounded",
              "hover:bg-slate-600",
              "disabled:opacity-50",
              isFirst && "opacity-50",
              isFirst && "cursor-not-allowed",
            ),
            onClick: onMoveUp,
          },
          "↑",
        );
        yield* button(
          {
            class: cn(
              "px-2",
              "py-1",
              "text-sm",
              "bg-slate-700",
              "rounded",
              "hover:bg-slate-600",
              "disabled:opacity-50",
              isLast && "opacity-50",
              isLast && "cursor-not-allowed",
            ),
            onClick: onMoveDown,
          },
          "↓",
        );
        yield* button(
          {
            class: cn(
              "px-2",
              "py-1",
              "text-sm",
              "bg-red-900/30",
              "text-red-400",
              "rounded",
              "hover:bg-red-900/50",
            ),
            onClick: onDelete,
          },
          "×",
        );
      });
    },
  );
};
