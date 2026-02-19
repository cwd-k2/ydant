import type { Component } from "@ydant/core";
import { div, span, button, text, classes, on } from "@ydant/base";
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

  return div(function* () {
    yield* classes(
      "list-item",
      "flex",
      "items-center",
      "gap-3",
      "p-3",
      "border",
      "rounded-lg",
      "mb-2",
      ...PRIORITY_COLORS[item.priority],
    );

    // Priority badge
    yield* span(() => [
      classes("text-xs", "font-medium", "px-2", "py-1", "rounded"),
      text(PRIORITY_LABELS[item.priority]),
    ]);

    // Item text
    yield* span(() => [classes("flex-1", "font-medium"), text(item.text)]);

    // Item ID (for debugging key behavior)
    yield* span(() => [classes("text-xs", "text-gray-400"), text(`#${item.id}`)]);

    // Move buttons
    yield* div(() => [
      classes("flex", "gap-1"),
      button(function* () {
        yield* classes(
          "px-2",
          "py-1",
          "text-sm",
          "bg-slate-700",
          "rounded",
          "hover:bg-slate-600",
          "disabled:opacity-50",
        );
        yield* on("click", onMoveUp);
        if (isFirst) {
          yield* classes("opacity-50", "cursor-not-allowed");
        }
        yield* text("↑");
      }),
      button(function* () {
        yield* classes(
          "px-2",
          "py-1",
          "text-sm",
          "bg-slate-700",
          "rounded",
          "hover:bg-slate-600",
          "disabled:opacity-50",
        );
        yield* on("click", onMoveDown);
        if (isLast) {
          yield* classes("opacity-50", "cursor-not-allowed");
        }
        yield* text("↓");
      }),
      button(function* () {
        yield* classes(
          "px-2",
          "py-1",
          "text-sm",
          "bg-red-900/30",
          "text-red-400",
          "rounded",
          "hover:bg-red-900/50",
        );
        yield* on("click", onDelete);
        yield* text("×");
      }),
    ]);
  });
};
