import {
  type Component,
  type Slot,
  div,
  h1,
  h2,
  p,
  button,
  input,
  select,
  option,
  text,
  clss,
  attr,
  on,
  key,
} from "@ydant/core";
import type { ListItem, SortOrder } from "./types";
import { ListItemView } from "./components/ListItemView";

// Initial data
const INITIAL_ITEMS: ListItem[] = [
  { id: 1, text: "Complete project proposal", priority: "high" },
  { id: 2, text: "Review code changes", priority: "medium" },
  { id: 3, text: "Update documentation", priority: "low" },
  { id: 4, text: "Fix critical bug", priority: "high" },
  { id: 5, text: "Write unit tests", priority: "medium" },
];

export const App: Component = () => {
  let items: ListItem[] = [...INITIAL_ITEMS];
  let nextId = 6;
  let newItemText = "";
  let newItemPriority: ListItem["priority"] = "medium";

  let listSlot: Slot;
  let statsSlot: Slot;

  // Sort items in place (one-time action)
  const sortItemsBy = (order: SortOrder) => {
    switch (order) {
      case "id":
        items.sort((a, b) => a.id - b.id);
        break;
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        items.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
        );
        break;
      case "text":
        items.sort((a, b) => a.text.localeCompare(b.text));
        break;
    }
    listSlot.refresh(renderList);
  };

  // Move item in array
  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    // Swap items
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    listSlot.refresh(renderList);
    statsSlot.refresh(renderStats);
  };

  const renderList = function* () {
    yield* clss(["space-y-2"]);

    if (items.length === 0) {
      yield* div(() => [
        clss([
          "p-8",
          "text-center",
          "text-gray-400",
          "border",
          "rounded-lg",
          "border-dashed",
        ]),
        text("No items. Add one above!"),
      ]);
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // key() を使用して DOM ノードを再利用
        // 並び替え時に同じ key を持つ要素は DOM が再利用される
        yield* key(item.id);

        yield* ListItemView({
          item,
          isFirst: i === 0,
          isLast: i === items.length - 1,
          onMoveUp: () => moveItem(i, -1),
          onMoveDown: () => moveItem(i, 1),
          onDelete: () => {
            items = items.filter((t) => t.id !== item.id);
            listSlot.refresh(renderList);
            statsSlot.refresh(renderStats);
          },
        });
      }
    }
  };

  const renderStats = function* () {
    yield* clss(["flex", "gap-4", "text-sm", "text-gray-500"]);

    const high = items.filter((i) => i.priority === "high").length;
    const medium = items.filter((i) => i.priority === "medium").length;
    const low = items.filter((i) => i.priority === "low").length;

    yield* div(() => [
      clss(["flex", "gap-2"]),
      div(() => [clss(["text-red-600"]), text(`High: ${high}`)]),
      div(() => [clss(["text-yellow-600"]), text(`Medium: ${medium}`)]),
      div(() => [clss(["text-green-600"]), text(`Low: ${low}`)]),
    ]);

    yield* div(() => [clss(["ml-auto"]), text(`Total: ${items.length}`)]);
  };

  return div(function* () {
    yield* clss(["space-y-6"]);

    // Header
    yield* h1(() => [
      clss(["text-2xl", "font-bold", "text-center", "text-purple-800"]),
      text("Sortable List with key()"),
    ]);

    yield* p(() => [
      clss(["text-center", "text-gray-500", "text-sm"]),
      text(
        "Demonstrates key() for efficient DOM updates. " +
          "Move items around and watch DOM IDs stay stable.",
      ),
    ]);

    // Add item form
    yield* div(function* () {
      yield* clss(["flex", "gap-2", "p-4", "bg-gray-50", "rounded-lg"]);

      yield* input(function* () {
        yield* attr("type", "text");
        yield* attr("placeholder", "New item text...");
        yield* clss([
          "flex-1",
          "px-3",
          "py-2",
          "border",
          "rounded",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-blue-500",
        ]);
        yield* on("input", (e) => {
          newItemText = (e.target as HTMLInputElement).value;
        });
      });

      yield* select(function* () {
        yield* clss(["px-3", "py-2", "border", "rounded"]);
        yield* on("change", (e) => {
          newItemPriority = (e.target as HTMLSelectElement)
            .value as ListItem["priority"];
        });

        yield* option(() => [attr("value", "high"), text("High")]);
        yield* option(() => [
          attr("value", "medium"),
          attr("selected", ""),
          text("Medium"),
        ]);
        yield* option(() => [attr("value", "low"), text("Low")]);
      });

      yield* button(function* () {
        yield* clss([
          "px-4",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "hover:bg-blue-600",
        ]);
        yield* on("click", () => {
          if (newItemText.trim()) {
            items.push({
              id: nextId++,
              text: newItemText.trim(),
              priority: newItemPriority,
            });
            newItemText = "";
            listSlot.refresh(renderList);
            statsSlot.refresh(renderStats);
          }
        });
        yield* text("Add");
      });
    });

    // Sort controls
    yield* div(function* () {
      yield* clss(["flex", "gap-2", "items-center"]);
      yield* h2(() => [
        clss(["text-sm", "font-medium", "text-gray-700"]),
        text("Sort by:"),
      ]);

      const sortButtons: { order: SortOrder; label: string }[] = [
        { order: "id", label: "ID" },
        { order: "priority", label: "Priority" },
        { order: "text", label: "Text" },
      ];

      for (const btn of sortButtons) {
        yield* button(function* () {
          yield* clss([
            "px-3",
            "py-1",
            "text-sm",
            "rounded",
            "bg-gray-200",
            "hover:bg-gray-300",
          ]);
          yield* on("click", () => sortItemsBy(btn.order));
          yield* text(btn.label);
        });
      }
    });

    // List
    listSlot = yield* div(renderList);

    // Stats
    statsSlot = yield* div(renderStats);

    // Info
    yield* div(() => [
      clss(["mt-4", "p-4", "bg-blue-50", "rounded-lg", "text-sm"]),
      h2(() => [clss(["font-semibold", "mb-2"]), text("How key() works:")]),
      p(() => [
        text(
          "The key() primitive tells the renderer to reuse existing DOM nodes " +
            "when refreshing a list. Without key(), all items would be recreated. " +
            "With key(), only the order changes - watch the DOM inspector!",
        ),
      ]),
    ]);
  });
};
