import type { Component } from "@ydant/core";
import { text, div, h1, p, span, button, input, classes, on, attr, type Slot } from "@ydant/base";
import type { Todo, Filter } from "./types";
import { loadTodos, saveTodos } from "./storage";
import { TodoItem } from "./components/TodoItem";
import { FilterButton } from "./components/FilterButton";

export const App: Component = () => {
  // State
  let todos: Todo[] = loadTodos();
  let filter: Filter = "all";
  let nextId = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;

  // Slot references (set later)
  let filterSlot: Slot;
  let todoListSlot: Slot;
  let statsSlot: Slot;

  // Helper functions
  const getFilteredTodos = (): Todo[] => {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  };

  const getActiveCount = (): number => {
    return todos.filter((t) => !t.completed).length;
  };

  // Render functions for refreshing
  const renderFilterButtons = function* () {
    yield* classes("flex", "gap-2", "mb-4", "justify-center");

    const filters: { key: Filter; label: string }[] = [
      { key: "all", label: "All" },
      { key: "active", label: "Active" },
      { key: "completed", label: "Completed" },
    ];

    for (const f of filters) {
      yield* FilterButton({
        label: f.label,
        isActive: filter === f.key,
        onClick: () => {
          filter = f.key;
          filterSlot.refresh(renderFilterButtons);
          todoListSlot.refresh(renderTodoList);
        },
      });
    }
  };

  const renderTodoList = function* () {
    yield* classes("border", "border-gray-200", "rounded-lg", "overflow-hidden", "mb-4");

    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
      yield* div(() => [
        classes("p-8", "text-center", "text-gray-400"),
        text(
          filter === "all"
            ? "No todos yet. Add one above!"
            : filter === "active"
              ? "No active todos."
              : "No completed todos.",
        ),
      ]);
    } else {
      for (const todo of filteredTodos) {
        yield* TodoItem({
          todo,
          onToggle: () => {
            todo.completed = !todo.completed;
            saveTodos(todos);
            todoListSlot.refresh(renderTodoList);
            statsSlot.refresh(renderStats);
          },
          onDelete: () => {
            todos = todos.filter((t) => t.id !== todo.id);
            saveTodos(todos);
            todoListSlot.refresh(renderTodoList);
            statsSlot.refresh(renderStats);
          },
        });
      }
    }
  };

  const renderStats = function* () {
    yield* classes("flex", "justify-between", "items-center", "text-sm", "text-gray-500");

    const activeCount = getActiveCount();
    const completedCount = todos.length - activeCount;

    yield* span(() => [text(`${activeCount} item${activeCount !== 1 ? "s" : ""} left`)]);

    if (completedCount > 0) {
      yield* button(function* () {
        yield* classes("text-red-500", "hover:text-red-700", "hover:underline");
        yield* on("click", () => {
          todos = todos.filter((t) => !t.completed);
          saveTodos(todos);
          todoListSlot.refresh(renderTodoList);
          statsSlot.refresh(renderStats);
        });
        yield* text("Clear completed");
      });
    }
  };

  return div(function* () {
    yield* classes("container", "mx-auto");

    // Title
    yield* h1(() => [
      classes("text-2xl", "font-bold", "text-center", "text-purple-800", "mb-6"),
      text("ToDo App"),
    ]);

    // Input section
    let inputValue = "";
    let inputSlot: Slot;

    yield* div(function* () {
      yield* classes("flex", "gap-2", "mb-6");

      // Text input
      inputSlot = yield* input(function* () {
        yield* attr("type", "text");
        yield* attr("placeholder", "What needs to be done?");
        yield* classes(
          "flex-1",
          "px-4",
          "py-2",
          "border",
          "border-gray-300",
          "rounded-lg",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-blue-500",
          "focus:border-transparent",
        );
        yield* on("input", (e) => {
          inputValue = (e.target as HTMLInputElement).value;
        });
        yield* on("keypress", (e) => {
          if ((e as KeyboardEvent).key === "Enter" && inputValue.trim()) {
            todos.push({
              id: nextId++,
              text: inputValue.trim(),
              completed: false,
            });
            saveTodos(todos);
            (inputSlot.node as HTMLInputElement).value = "";
            inputValue = "";
            todoListSlot.refresh(renderTodoList);
            statsSlot.refresh(renderStats);
          }
        });
      });

      // Add button
      yield* button(function* () {
        yield* classes(
          "btn-add",
          "px-6",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded-lg",
          "hover:bg-blue-600",
          "font-semibold",
        );
        yield* on("click", () => {
          if (inputValue.trim()) {
            todos.push({
              id: nextId++,
              text: inputValue.trim(),
              completed: false,
            });
            saveTodos(todos);
            (inputSlot.node as HTMLInputElement).value = "";
            inputValue = "";
            todoListSlot.refresh(renderTodoList);
            statsSlot.refresh(renderStats);
          }
        });
        yield* text("Add");
      });
    });

    // Filter buttons
    filterSlot = yield* div(renderFilterButtons);

    // Todo list
    todoListSlot = yield* div(renderTodoList);

    // Stats
    statsSlot = yield* div(renderStats);

    // Footer info
    yield* p(() => [
      classes("text-center", "text-xs", "text-gray-400", "mt-6"),
      text("Double-click to edit a todo (not implemented). Data is saved to localStorage."),
    ]);
  });
};
