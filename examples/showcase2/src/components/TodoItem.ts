import type { Component } from "@ydant/core";
import { div, input, span, button, cn } from "@ydant/base";
import type { Todo } from "../types";

export interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export const TodoItem: Component<TodoItemProps> = (props) => {
  const { todo, onToggle, onDelete } = props;

  return div(
    {
      class: "todo-item flex items-center gap-3 p-3 border-b border-slate-700",
    },
    function* () {
      // Checkbox
      yield* input({
        type: "checkbox",
        ...(todo.completed ? { checked: "checked" } : {}),
        class: "w-5 h-5 rounded border-slate-600 cursor-pointer",
        onChange: onToggle,
      });

      // Todo text
      yield* span(
        {
          class: cn("flex-1 text-gray-200", todo.completed && "todo-completed"),
        },
        todo.text,
      );

      // Delete button
      yield* button(
        {
          class: "btn-delete px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-900/30 rounded",
          onClick: onDelete,
        },
        "\u00d7",
      );
    },
  );
};
