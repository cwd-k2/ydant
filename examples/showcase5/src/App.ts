import type { Component } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { refresh, div, h1, h2, p, button, input, select, option, keyed } from "@ydant/base";
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
        items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case "text":
        items.sort((a, b) => a.text.localeCompare(b.text));
        break;
    }
    refresh(listSlot, renderList);
  };

  // Move item in array
  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    // Swap items
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    refresh(listSlot, renderList);
    refresh(statsSlot, renderStats);
  };

  const renderList = function* () {
    if (items.length === 0) {
      yield* div(
        { class: "p-8 text-center text-gray-400 border rounded-lg border-dashed" },
        "No items. Add one above!",
      );
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
            refresh(listSlot, renderList);
            refresh(statsSlot, renderStats);
          },
        });
      }
    }
  };

  const renderStats = function* () {
    const high = items.filter((i) => i.priority === "high").length;
    const medium = items.filter((i) => i.priority === "medium").length;
    const low = items.filter((i) => i.priority === "low").length;

    yield* div({ class: "flex gap-2" }, function* () {
      yield* div({ class: "text-red-400" }, `High: ${high}`);
      yield* div({ class: "text-yellow-400" }, `Medium: ${medium}`);
      yield* div({ class: "text-green-400" }, `Low: ${low}`);
    });

    yield* div({ class: "ml-auto" }, `Total: ${items.length}`);
  };

  return div({ class: "space-y-6" }, function* () {
    // Header
    yield* h1(
      { class: "text-2xl font-bold text-center text-purple-300" },
      "Sortable List with keyed()",
    );

    yield* p(
      { class: "text-center text-gray-400 text-sm" },
      "Demonstrates keyed() for efficient DOM updates. " +
        "Move items around and watch DOM IDs stay stable.",
    );

    // Add item form
    yield* div({ class: "flex gap-2 p-4 bg-slate-800 rounded-lg" }, function* () {
      yield* input({
        type: "text",
        placeholder: "New item text...",
        class:
          "flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
        onInput: (e) => {
          newItemText = (e.target as HTMLInputElement).value;
        },
      });

      yield* select(
        {
          class: "px-3 py-2 border rounded",
          onChange: (e) => {
            newItemPriority = (e.target as HTMLSelectElement).value as ListItem["priority"];
          },
        },
        function* () {
          yield* option({ value: "high" }, "High");
          yield* option({ value: "medium", selected: "" }, "Medium");
          yield* option({ value: "low" }, "Low");
        },
      );

      yield* button(
        {
          class: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600",
          onClick: () => {
            if (newItemText.trim()) {
              items.push({
                id: nextId++,
                text: newItemText.trim(),
                priority: newItemPriority,
              });
              newItemText = "";
              refresh(listSlot, renderList);
              refresh(statsSlot, renderStats);
            }
          },
        },
        "Add",
      );
    });

    // Sort controls
    yield* div({ class: "flex gap-2 items-center" }, function* () {
      yield* h2({ class: "text-sm font-medium text-gray-300" }, "Sort by:");

      const sortButtons: { order: SortOrder; label: string }[] = [
        { order: "id", label: "ID" },
        { order: "priority", label: "Priority" },
        { order: "text", label: "Text" },
      ];

      for (const btn of sortButtons) {
        yield* button(
          {
            class: "px-3 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600",
            onClick: () => sortItemsBy(btn.order),
          },
          btn.label,
        );
      }
    });

    // List
    listSlot = yield* div({ class: "space-y-2" }, renderList);

    // Stats
    statsSlot = yield* div({ class: "flex gap-4 text-sm text-gray-400" }, renderStats);

    // Info
    yield* div({ class: "mt-4 p-4 bg-blue-900/30 rounded-lg text-sm" }, function* () {
      yield* h2({ class: "font-semibold mb-2" }, "How keyed() works:");
      yield* p(
        {},
        "The keyed() wrapper tells the renderer to reuse existing DOM nodes " +
          "when refreshing a list. Without keyed(), all items would be recreated. " +
          "With keyed(), only the order changes - watch the DOM inspector!",
      );
    });
  });
};
