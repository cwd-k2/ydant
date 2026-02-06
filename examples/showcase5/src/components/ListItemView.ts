import type { Component } from "@ydant/core";
import { div, span, button, text, classes, on } from "@ydant/base";
import type { ListItem } from "../types";

const PRIORITY_COLORS: Record<ListItem["priority"], string[]> = {
  high: ["bg-red-100", "text-red-800", "border-red-200"],
  medium: ["bg-yellow-100", "text-yellow-800", "border-yellow-200"],
  low: ["bg-green-100", "text-green-800", "border-green-200"],
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
    yield* span(() => [classes("text-xs", "text-gray-500"), text(`#${item.id}`)]);

    // Move buttons
    yield* div(() => [
      classes("flex", "gap-1"),
      button(function* () {
        yield* classes(
          "px-2",
          "py-1",
          "text-sm",
          "bg-gray-200",
          "rounded",
          "hover:bg-gray-300",
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
          "bg-gray-200",
          "rounded",
          "hover:bg-gray-300",
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
          "bg-red-200",
          "text-red-700",
          "rounded",
          "hover:bg-red-300",
        );
        yield* on("click", onDelete);
        yield* text("×");
      }),
    ]);
  });
};
