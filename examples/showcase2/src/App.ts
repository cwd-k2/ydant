import type { Component } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { div, h1, p, span, button, input, refresh } from "@ydant/base";
import type { Todo, Filter } from "./types";
import { loadTodos, saveTodos } from "./storage";
import { TodoItem } from "./components/TodoItem";
import { FilterButton } from "./components/FilterButton";

export const App: Component = () => {
  // State
  let todos: Todo[] = loadTodos();
  let filter: Filter = "all";
  let nextId = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;

  // Slot references
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
          refresh(filterSlot, renderFilterButtons);
          refresh(todoListSlot, renderTodoList);
        },
      });
    }
  };

  const renderTodoList = function* () {
    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
      yield* div(
        { class: "p-8 text-center text-gray-400" },
        filter === "all"
          ? "No todos yet. Add one above!"
          : filter === "active"
            ? "No active todos."
            : "No completed todos.",
      );
    } else {
      for (const todo of filteredTodos) {
        yield* TodoItem({
          todo,
          onToggle: () => {
            todo.completed = !todo.completed;
            saveTodos(todos);
            refresh(todoListSlot, renderTodoList);
            refresh(statsSlot, renderStats);
          },
          onDelete: () => {
            todos = todos.filter((t) => t.id !== todo.id);
            saveTodos(todos);
            refresh(todoListSlot, renderTodoList);
            refresh(statsSlot, renderStats);
          },
        });
      }
    }
  };

  const renderStats = function* () {
    const activeCount = getActiveCount();
    const completedCount = todos.length - activeCount;

    yield* span(`${activeCount} item${activeCount !== 1 ? "s" : ""} left`);

    if (completedCount > 0) {
      yield* button(
        {
          class: "text-red-500 hover:text-red-400 hover:underline",
          onClick: () => {
            todos = todos.filter((t) => !t.completed);
            saveTodos(todos);
            refresh(todoListSlot, renderTodoList);
            refresh(statsSlot, renderStats);
          },
        },
        "Clear completed",
      );
    }
  };

  return div({ class: "container mx-auto" }, function* () {
    // Title
    yield* h1({ class: "text-2xl font-bold text-center text-purple-300 mb-6" }, "ToDo App");

    // Input section
    let inputValue = "";
    let inputSlot: Slot;

    yield* div({ class: "flex gap-2 mb-6" }, function* () {
      // Text input
      inputSlot = yield* input({
        type: "text",
        placeholder: "What needs to be done?",
        class:
          "flex-1 px-4 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        onInput: (e) => {
          inputValue = (e.target as HTMLInputElement).value;
        },
        onKeypress: (e) => {
          if ((e as KeyboardEvent).key === "Enter" && inputValue.trim()) {
            todos.push({
              id: nextId++,
              text: inputValue.trim(),
              completed: false,
            });
            saveTodos(todos);
            (inputSlot.node as HTMLInputElement).value = "";
            inputValue = "";
            refresh(todoListSlot, renderTodoList);
            refresh(statsSlot, renderStats);
          }
        },
      });

      // Add button
      yield* button(
        {
          class:
            "btn-add px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold",
          onClick: () => {
            if (inputValue.trim()) {
              todos.push({
                id: nextId++,
                text: inputValue.trim(),
                completed: false,
              });
              saveTodos(todos);
              (inputSlot.node as HTMLInputElement).value = "";
              inputValue = "";
              refresh(todoListSlot, renderTodoList);
              refresh(statsSlot, renderStats);
            }
          },
        },
        "Add",
      );
    });

    // Filter buttons
    filterSlot = yield* div({ class: "flex gap-2 mb-4 justify-center" }, renderFilterButtons);

    // Todo list
    todoListSlot = yield* div(
      { class: "border border-slate-700 rounded-lg overflow-hidden mb-4" },
      renderTodoList,
    );

    // Stats
    statsSlot = yield* div(
      { class: "flex justify-between items-center text-sm text-gray-400" },
      renderStats,
    );

    // Footer info
    yield* p(
      { class: "text-center text-xs text-gray-400 mt-6" },
      "Double-click to edit a todo (not implemented). Data is saved to localStorage.",
    );
  });
};
