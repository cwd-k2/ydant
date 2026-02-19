import type { Component } from "@ydant/core";
import {
  createSlotRef,
  div,
  h1,
  h2,
  p,
  button,
  input,
  select,
  option,
  text,
  classes,
  attr,
  on,
  keyed,
} from "@ydant/base";
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

  const listRef = createSlotRef();
  const statsRef = createSlotRef();

  // Sort items in place (one-time action)
  const sortItemsBy = (order: SortOrder) => {
    switch (order) {
      case "id":
        items.sort((a, b) => a.id - b.id);
        break;
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case "text":
        items.sort((a, b) => a.text.localeCompare(b.text));
        break;
    }
    listRef.refresh(renderList);
  };

  // Move item in array
  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    // Swap items
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    listRef.refresh(renderList);
    statsRef.refresh(renderStats);
  };

  const renderList = function* () {
    yield* classes("space-y-2");

    if (items.length === 0) {
      yield* div(() => [
        classes("p-8", "text-center", "text-gray-400", "border", "rounded-lg", "border-dashed"),
        text("No items. Add one above!"),
      ]);
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // keyed() を使用して DOM ノードを再利用
        // 並び替え時に同じ key を持つ要素は DOM が再利用される
        yield* keyed(
          item.id,
          ListItemView,
        )({
          item,
          isFirst: i === 0,
          isLast: i === items.length - 1,
          onMoveUp: () => moveItem(i, -1),
          onMoveDown: () => moveItem(i, 1),
          onDelete: () => {
            items = items.filter((t) => t.id !== item.id);
            listRef.refresh(renderList);
            statsRef.refresh(renderStats);
          },
        });
      }
    }
  };

  const renderStats = function* () {
    yield* classes("flex", "gap-4", "text-sm", "text-gray-400");

    const high = items.filter((i) => i.priority === "high").length;
    const medium = items.filter((i) => i.priority === "medium").length;
    const low = items.filter((i) => i.priority === "low").length;

    yield* div(() => [
      classes("flex", "gap-2"),
      div(() => [classes("text-red-400"), text(`High: ${high}`)]),
      div(() => [classes("text-yellow-400"), text(`Medium: ${medium}`)]),
      div(() => [classes("text-green-400"), text(`Low: ${low}`)]),
    ]);

    yield* div(() => [classes("ml-auto"), text(`Total: ${items.length}`)]);
  };

  return div(function* () {
    yield* classes("space-y-6");

    // Header
    yield* h1(() => [
      classes("text-2xl", "font-bold", "text-center", "text-purple-300"),
      text("Sortable List with keyed()"),
    ]);

    yield* p(() => [
      classes("text-center", "text-gray-400", "text-sm"),
      text(
        "Demonstrates keyed() for efficient DOM updates. " +
          "Move items around and watch DOM IDs stay stable.",
      ),
    ]);

    // Add item form
    yield* div(function* () {
      yield* classes("flex", "gap-2", "p-4", "bg-slate-800", "rounded-lg");

      yield* input(function* () {
        yield* attr("type", "text");
        yield* attr("placeholder", "New item text...");
        yield* classes(
          "flex-1",
          "px-3",
          "py-2",
          "border",
          "rounded",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-blue-500",
        );
        yield* on("input", (e) => {
          newItemText = (e.target as HTMLInputElement).value;
        });
      });

      yield* select(function* () {
        yield* classes("px-3", "py-2", "border", "rounded");
        yield* on("change", (e) => {
          newItemPriority = (e.target as HTMLSelectElement).value as ListItem["priority"];
        });

        yield* option(() => [attr("value", "high"), text("High")]);
        yield* option(() => [attr("value", "medium"), attr("selected", ""), text("Medium")]);
        yield* option(() => [attr("value", "low"), text("Low")]);
      });

      yield* button(function* () {
        yield* classes("px-4", "py-2", "bg-blue-500", "text-white", "rounded", "hover:bg-blue-600");
        yield* on("click", () => {
          if (newItemText.trim()) {
            items.push({
              id: nextId++,
              text: newItemText.trim(),
              priority: newItemPriority,
            });
            newItemText = "";
            listRef.refresh(renderList);
            statsRef.refresh(renderStats);
          }
        });
        yield* text("Add");
      });
    });

    // Sort controls
    yield* div(function* () {
      yield* classes("flex", "gap-2", "items-center");
      yield* h2(() => [classes("text-sm", "font-medium", "text-gray-300"), text("Sort by:")]);

      const sortButtons: { order: SortOrder; label: string }[] = [
        { order: "id", label: "ID" },
        { order: "priority", label: "Priority" },
        { order: "text", label: "Text" },
      ];

      for (const btn of sortButtons) {
        yield* button(function* () {
          yield* classes(
            "px-3",
            "py-1",
            "text-sm",
            "rounded",
            "bg-slate-700",
            "hover:bg-slate-600",
          );
          yield* on("click", () => sortItemsBy(btn.order));
          yield* text(btn.label);
        });
      }
    });

    // List
    listRef.bind(yield* div(renderList));

    // Stats
    statsRef.bind(yield* div(renderStats));

    // Info
    yield* div(() => [
      classes("mt-4", "p-4", "bg-blue-900/30", "rounded-lg", "text-sm"),
      h2(() => [classes("font-semibold", "mb-2"), text("How keyed() works:")]),
      p(() => [
        text(
          "The keyed() wrapper tells the renderer to reuse existing DOM nodes " +
            "when refreshing a list. Without keyed(), all items would be recreated. " +
            "With keyed(), only the order changes - watch the DOM inspector!",
        ),
      ]),
    ]);
  });
};
