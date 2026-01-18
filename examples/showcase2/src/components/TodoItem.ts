import { div, input, span, button, clss, on, attr, text, type Component } from "@ydant/core";
import type { Todo } from "../types";

export interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem(props: TodoItemProps): Component {
  const { todo, onToggle, onDelete } = props;

  return div(() => [
    clss([
      "todo-item",
      "flex",
      "items-center",
      "gap-3",
      "p-3",
      "border-b",
      "border-gray-100",
    ]),

    // Checkbox
    input(() => [
      attr("type", "checkbox"),
      ...(todo.completed ? [attr("checked", "checked")] : []),
      clss(["w-5", "h-5", "rounded", "border-gray-300", "cursor-pointer"]),
      on("change", onToggle),
    ]),

    // Todo text
    span(() => [
      clss([
        "flex-1",
        "text-gray-700",
        ...(todo.completed ? ["todo-completed"] : []),
      ]),
      text(todo.text),
    ]),

    // Delete button
    button(() => [
      clss([
        "btn-delete",
        "px-2",
        "py-1",
        "text-red-500",
        "hover:text-red-700",
        "hover:bg-red-50",
        "rounded",
      ]),
      on("click", onDelete),
      text("×"),
    ]),
  ]);
}
