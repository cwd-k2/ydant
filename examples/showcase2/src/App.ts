import {
  text,
  div,
  h1,
  p,
  span,
  button,
  input,
  clss,
  on,
  attr,
  tap,
  compose,
  type Refresher,
} from "@ydant/core";
import type { Todo, Filter } from "./types";
import { loadTodos, saveTodos } from "./storage";
import { TodoItem } from "./components/TodoItem";
import { FilterButton } from "./components/FilterButton";

export const App = compose<{}>(function* () {
  // State
  let todos: Todo[] = loadTodos();
  let filter: Filter = "all";
  let nextId = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;

  // Refresher references (set later)
  const refreshers: {
    filter?: Refresher;
    todoList?: Refresher;
    stats?: Refresher;
  } = {};

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
    yield* clss(["flex", "gap-2", "mb-4", "justify-center"]);

    const filters: { key: Filter; label: string }[] = [
      { key: "all", label: "All" },
      { key: "active", label: "Active" },
      { key: "completed", label: "Completed" },
    ];

    for (const f of filters) {
      yield* FilterButton(function* (provide) {
        yield* provide("label", f.label);
        yield* provide("isActive", filter === f.key);
        yield* provide("onClick", () => {
          filter = f.key;
          refreshers.filter?.(renderFilterButtons);
          refreshers.todoList?.(renderTodoList);
        });
      });
    }
  };

  const renderTodoList = function* () {
    yield* clss([
      "border",
      "border-gray-200",
      "rounded-lg",
      "overflow-hidden",
      "mb-4",
    ]);

    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
      yield* div(() => [
        clss(["p-8", "text-center", "text-gray-400"]),
        text(
          filter === "all"
            ? "No todos yet. Add one above!"
            : filter === "active"
              ? "No active todos."
              : "No completed todos."
        ),
      ]);
    } else {
      for (const todo of filteredTodos) {
        yield* TodoItem(function* (provide) {
          yield* provide("todo", todo);
          yield* provide("onToggle", () => {
            todo.completed = !todo.completed;
            saveTodos(todos);
            refreshers.todoList?.(renderTodoList);
            refreshers.stats?.(renderStats);
          });
          yield* provide("onDelete", () => {
            todos = todos.filter((t) => t.id !== todo.id);
            saveTodos(todos);
            refreshers.todoList?.(renderTodoList);
            refreshers.stats?.(renderStats);
          });
        });
      }
    }
  };

  const renderStats = function* () {
    yield* clss(["flex", "justify-between", "items-center", "text-sm", "text-gray-500"]);

    const activeCount = getActiveCount();
    const completedCount = todos.length - activeCount;

    yield* span(() => [
      text(`${activeCount} item${activeCount !== 1 ? "s" : ""} left`),
    ]);

    if (completedCount > 0) {
      yield* button(function* () {
        yield* clss([
          "text-red-500",
          "hover:text-red-700",
          "hover:underline",
        ]);
        yield* on("click", () => {
          todos = todos.filter((t) => !t.completed);
          saveTodos(todos);
          refreshers.todoList?.(renderTodoList);
          refreshers.stats?.(renderStats);
        });
        yield* text("Clear completed");
      });
    }
  };

  return div(function* () {
    yield* clss(["container", "mx-auto"]);

    // Title
    yield* h1(() => [
      clss(["text-2xl", "font-bold", "text-center", "text-purple-800", "mb-6"]),
      text("ToDo App"),
    ]);

    // Input section
    let inputValue = "";
    let inputElement: HTMLInputElement | null = null;

    yield* div(function* () {
      yield* clss(["flex", "gap-2", "mb-6"]);

      // Text input
      yield* input(function* () {
        yield* attr("type", "text");
        yield* attr("placeholder", "What needs to be done?");
        yield* clss([
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
        ]);
        yield* tap<HTMLInputElement>((el) => {
          inputElement = el;
        });
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
            (e.target as HTMLInputElement).value = "";
            inputValue = "";
            refreshers.todoList?.(renderTodoList);
            refreshers.stats?.(renderStats);
          }
        });
      });

      // Add button
      yield* button(function* () {
        yield* clss([
          "btn-add",
          "px-6",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded-lg",
          "hover:bg-blue-600",
          "font-semibold",
        ]);
        yield* on("click", () => {
          if (inputValue.trim()) {
            todos.push({
              id: nextId++,
              text: inputValue.trim(),
              completed: false,
            });
            saveTodos(todos);
            if (inputElement) {
              inputElement.value = "";
            }
            inputValue = "";
            refreshers.todoList?.(renderTodoList);
            refreshers.stats?.(renderStats);
          }
        });
        yield* text("Add");
      });
    });

    // Filter buttons
    refreshers.filter = yield* div(renderFilterButtons);

    // Todo list
    refreshers.todoList = yield* div(renderTodoList);

    // Stats
    refreshers.stats = yield* div(renderStats);

    // Footer info
    yield* p(() => [
      clss(["text-center", "text-xs", "text-gray-400", "mt-6"]),
      text("Double-click to edit a todo (not implemented). Data is saved to localStorage."),
    ]);
  });
});
