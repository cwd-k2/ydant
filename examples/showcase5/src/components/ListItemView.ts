import { div, span, button, text, clss, on } from "@ydant/base";
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

export function ListItemView(props: ListItemViewProps) {
  const { item, onMoveUp, onMoveDown, onDelete, isFirst, isLast } = props;

  return div(function* () {
    yield* clss([
      "list-item",
      "flex",
      "items-center",
      "gap-3",
      "p-3",
      "border",
      "rounded-lg",
      "mb-2",
      ...PRIORITY_COLORS[item.priority],
    ]);

    // Priority badge
    yield* span(() => [
      clss(["text-xs", "font-medium", "px-2", "py-1", "rounded"]),
      text(PRIORITY_LABELS[item.priority]),
    ]);

    // Item text
    yield* span(() => [clss(["flex-1", "font-medium"]), text(item.text)]);

    // Item ID (for debugging key behavior)
    yield* span(() => [clss(["text-xs", "text-gray-500"]), text(`#${item.id}`)]);

    // Move buttons
    yield* div(() => [
      clss(["flex", "gap-1"]),
      button(function* () {
        yield* clss([
          "px-2",
          "py-1",
          "text-sm",
          "bg-gray-200",
          "rounded",
          "hover:bg-gray-300",
          "disabled:opacity-50",
        ]);
        yield* on("click", onMoveUp);
        if (isFirst) {
          yield* clss(["opacity-50", "cursor-not-allowed"]);
        }
        yield* text("↑");
      }),
      button(function* () {
        yield* clss([
          "px-2",
          "py-1",
          "text-sm",
          "bg-gray-200",
          "rounded",
          "hover:bg-gray-300",
          "disabled:opacity-50",
        ]);
        yield* on("click", onMoveDown);
        if (isLast) {
          yield* clss(["opacity-50", "cursor-not-allowed"]);
        }
        yield* text("↓");
      }),
      button(function* () {
        yield* clss([
          "px-2",
          "py-1",
          "text-sm",
          "bg-red-200",
          "text-red-700",
          "rounded",
          "hover:bg-red-300",
        ]);
        yield* on("click", onDelete);
        yield* text("×");
      }),
    ]);
  });
}
