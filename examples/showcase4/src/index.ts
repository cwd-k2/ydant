/**
 * Showcase 4 - SPA Demo
 *
 * Router, Context, Reactive の使用例
 * Form バリデーションはユーザー実装例として示す
 *
 * プラグインアーキテクチャの使用例:
 * - createReactivePlugin() で reactive プリミティブを有効化
 * - createContextPlugin() で provide/inject を有効化
 */

import { mount } from "@ydant/dom";
import {
  type Component,
  div,
  h1,
  h2,
  p,
  button,
  span,
  nav,
  input,
  label,
  ul,
  li,
  text,
  attr,
  clss,
  on,
  onMount,
} from "@ydant/core";
import { RouterView, RouterLink, useRoute, navigate } from "@ydant/router";
import { createStorage } from "@ydant/context";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";

// =============================================================================
// Form Validation (User-implemented example)
// =============================================================================

type ValidationResult = string | null;
type Validator = (value: unknown) => ValidationResult;

/** 必須バリデータ */
function required(message = "This field is required"): Validator {
  return (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return message;
    }
    return null;
  };
}

/** メールバリデータ */
function email(message = "Invalid email address"): Validator {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value: unknown) => {
    if (typeof value !== "string" || !value) return null;
    return emailRegex.test(value) ? null : message;
  };
}

/** 最小文字数バリデータ */
function minLength(min: number, message?: string): Validator {
  return (value: unknown) => {
    if (typeof value !== "string" || !value) return null;
    return value.length >= min
      ? null
      : message || `Minimum ${min} characters required`;
  };
}

/** シンプルなフォーム状態管理 */
interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string | null>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

function createSimpleForm<T extends Record<string, unknown>>(options: {
  initialValues: T;
  validations?: Partial<Record<keyof T, Validator[]>>;
  onSubmit?: (values: T) => void;
}) {
  const {
    initialValues,
    validations = {} as Partial<Record<keyof T, Validator[]>>,
    onSubmit,
  } = options;

  let values = { ...initialValues };
  let errors: Partial<Record<keyof T, string | null>> = {};
  let touched: Partial<Record<keyof T, boolean>> = {};
  let isSubmitting = false;
  const listeners: Array<() => void> = [];

  const notify = () => {
    for (const fn of listeners) fn();
  };

  const validateField = (field: keyof T): string | null => {
    const fieldValidators = validations[field];
    if (!fieldValidators) return null;
    for (const validator of fieldValidators) {
      const result = validator(values[field]);
      if (result) return result;
    }
    return null;
  };

  const validate = (): boolean => {
    let isValid = true;
    for (const key of Object.keys(validations) as Array<keyof T>) {
      const error = validateField(key);
      errors[key] = error;
      if (error) isValid = false;
    }
    notify();
    return isValid;
  };

  return {
    getState(): FormState<T> {
      return { values, errors, touched, isSubmitting };
    },
    getValue<K extends keyof T>(field: K): T[K] {
      return values[field];
    },
    setValue<K extends keyof T>(field: K, value: T[K]): void {
      values[field] = value;
      errors[field] = validateField(field);
      notify();
    },
    setTouched<K extends keyof T>(field: K): void {
      touched[field] = true;
      errors[field] = validateField(field);
      notify();
    },
    submit(): void {
      // Mark all as touched
      for (const key of Object.keys(values) as Array<keyof T>) {
        touched[key] = true;
      }
      if (validate() && onSubmit) {
        isSubmitting = true;
        notify();
        onSubmit(values);
        isSubmitting = false;
        notify();
      }
    },
    reset(): void {
      values = { ...initialValues };
      errors = {};
      touched = {};
      isSubmitting = false;
      notify();
    },
    subscribe(listener: () => void): () => void {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
  };
}

// =============================================================================
// Context: Theme
// =============================================================================

type Theme = "light" | "dark";

// 永続化されたテーマ設定
const themeStorage = createStorage<Theme>("theme", "light");
const currentTheme = signal<Theme>(themeStorage.get());

// テーマを切り替える関数
function toggleTheme() {
  const newTheme = currentTheme() === "light" ? "dark" : "light";
  currentTheme.set(newTheme);
  themeStorage.set(newTheme);
}

// =============================================================================
// Data: Users
// =============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

const users = signal<User[]>([
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" },
]);

// =============================================================================
// Components
// =============================================================================

/** ナビゲーションバー */
function NavBar() {
  return nav(function* () {
    yield* clss([
      "flex",
      "gap-4",
      "p-4",
      "bg-gray-100",
      "dark:bg-gray-800",
      "border-b",
    ]);

    yield* RouterLink({
      href: "/",
      children: () =>
        span(function* () {
          yield* clss(["hover:underline", "cursor-pointer"]);
          yield* text("Home");
        }),
    });

    yield* RouterLink({
      href: "/users",
      children: () =>
        span(function* () {
          yield* clss(["hover:underline", "cursor-pointer"]);
          yield* text("Users");
        }),
    });

    yield* RouterLink({
      href: "/contact",
      children: () =>
        span(function* () {
          yield* clss(["hover:underline", "cursor-pointer"]);
          yield* text("Contact");
        }),
    });

    // テーマ切り替えボタン
    yield* button(function* () {
      yield* clss([
        "ml-auto",
        "px-3",
        "py-1",
        "bg-gray-200",
        "dark:bg-gray-700",
        "rounded",
      ]);
      yield* on("click", toggleTheme);

      yield* reactive(() => [
        text(currentTheme() === "light" ? "🌙 Dark" : "☀️ Light"),
      ]);
    });
  });
}

/** ホームページ */
const HomePage: Component = () =>
  div(function* () {
    yield* clss(["p-6"]);
    yield* h1(() => [clss(["text-3xl", "font-bold", "mb-4"]), text("Welcome!")]);
    yield* p(() => [
      clss(["text-gray-600", "dark:text-gray-300"]),
      text(
        "This is a demo of Ydant SPA with Router, Context, and Reactive features."
      ),
    ]);

    yield* div(function* () {
      yield* clss(["mt-6", "p-4", "bg-blue-50", "dark:bg-blue-900", "rounded"]);
      yield* h2(() => [clss(["font-semibold", "mb-2"]), text("Features used:")]);
      yield* ul(() => [
        clss(["list-disc", "list-inside", "space-y-1"]),
        li(() => [text("RouterView/RouterLink - Client-side navigation")]),
        li(() => [text("Context Plugin - Theme switching with persistence")]),
        li(() => [text("Reactive Plugin - Signal-based state management")]),
        li(() => [text("User-implemented Form validation")]),
      ]);
    });

    yield* div(function* () {
      yield* clss(["mt-6", "p-4", "bg-green-50", "dark:bg-green-900", "rounded"]);
      yield* h2(() => [clss(["font-semibold", "mb-2"]), text("Plugin Architecture:")]);
      yield* p(() => [
        clss(["text-sm"]),
        text(
          "This app uses the plugin system: createReactivePlugin() and createContextPlugin() " +
            "are passed to mount() to enable reactive and context features."
        ),
      ]);
    });
  });

/** ユーザー一覧ページ */
const UsersPage: Component = () =>
  div(function* () {
    yield* clss(["p-6"]);
    yield* h1(() => [clss(["text-2xl", "font-bold", "mb-4"]), text("Users")]);

    // 新しいユーザーを追加するボタン
    yield* button(function* () {
      yield* clss([
        "mb-4",
        "px-4",
        "py-2",
        "bg-blue-500",
        "text-white",
        "rounded",
        "hover:bg-blue-600",
      ]);
      yield* on("click", () => {
        const id = Date.now();
        users.update((list: User[]) => [
          ...list,
          { id, name: `User ${id}`, email: `user${id}@example.com` },
        ]);
      });
      yield* text("Add User");
    });

    // ユーザーリスト（リアクティブ）
    yield* reactive(() => [
      ul(function* () {
        yield* clss(["space-y-2"]);

        for (const user of users()) {
          yield* li(function* () {
            yield* clss([
              "p-3",
              "bg-gray-50",
              "dark:bg-gray-700",
              "rounded",
              "flex",
              "justify-between",
              "items-center",
            ]);

            yield* span(() => [text(`${user.name} (${user.email})`)]);

            yield* div(() => [
              clss(["flex", "gap-2"]),
              button(function* () {
                yield* clss([
                  "px-2",
                  "py-1",
                  "bg-blue-500",
                  "text-white",
                  "text-sm",
                  "rounded",
                ]);
                yield* on("click", () => navigate(`/users/${user.id}`));
                yield* text("View");
              }),
              button(function* () {
                yield* clss([
                  "px-2",
                  "py-1",
                  "bg-red-500",
                  "text-white",
                  "text-sm",
                  "rounded",
                ]);
                yield* on("click", () => {
                  users.update((list: User[]) =>
                    list.filter((u: User) => u.id !== user.id)
                  );
                });
                yield* text("Delete");
              }),
            ]);
          });
        }
      }),
    ]);
  });

/** ユーザー詳細ページ */
const UserDetailPage: Component = () =>
  div(function* () {
    yield* clss(["p-6"]);
    const route = useRoute();
    const userId = parseInt(route.params.id, 10);
    const user = users().find((u: User) => u.id === userId);

    if (user) {
      yield* h1(() => [
        clss(["text-2xl", "font-bold", "mb-4"]),
        text(`User: ${user.name}`),
      ]);
      yield* div(function* () {
        yield* clss(["space-y-2"]);
        yield* p(() => [
          span(() => [clss(["font-semibold"]), text("ID: ")]),
          text(String(user.id)),
        ]);
        yield* p(() => [
          span(() => [clss(["font-semibold"]), text("Email: ")]),
          text(user.email),
        ]);
      });
    } else {
      yield* h1(() => [
        clss(["text-2xl", "font-bold", "mb-4", "text-red-500"]),
        text("User Not Found"),
      ]);
    }

    yield* button(function* () {
      yield* clss([
        "mt-4",
        "px-4",
        "py-2",
        "bg-gray-500",
        "text-white",
        "rounded",
      ]);
      yield* on("click", () => navigate("/users"));
      yield* text("← Back to Users");
    });
  });

/** コンタクトフォームページ（ユーザー実装のフォームバリデーション例） */
const ContactPage: Component = () => {
  // フォーム状態の作成（ユーザー実装）
  const form = createSimpleForm({
    initialValues: {
      name: "",
      email: "",
      message: "",
    },
    validations: {
      name: [required("Name is required"), minLength(2, "Min 2 characters")],
      email: [required("Email is required"), email("Invalid email")],
      message: [
        required("Message is required"),
        minLength(10, "Min 10 characters"),
      ],
    },
    onSubmit: (values) => {
      alert(`Thank you, ${values.name}! Your message has been sent.`);
      form.reset();
    },
  });

  // フォームの状態が変わったら再レンダリングするための signal
  const formState = signal(form.getState());
  form.subscribe(() => {
    formState.set(form.getState());
  });

  return div(function* () {
    yield* clss(["p-6", "max-w-md"]);
    yield* h1(() => [clss(["text-2xl", "font-bold", "mb-4"]), text("Contact")]);

    yield* p(() => [
      clss(["text-sm", "text-gray-500", "mb-4"]),
      text("This form uses user-implemented validation (not a library)."),
    ]);

    yield* div(function* () {
      yield* clss(["space-y-4"]);

      // Name field
      yield* div(function* () {
        yield* label(() => [
          clss(["block", "font-medium", "mb-1"]),
          text("Name"),
        ]);
        yield* input(function* () {
          yield* attr("type", "text");
          yield* attr("value", form.getValue("name") as string);
          yield* clss([
            "w-full",
            "px-3",
            "py-2",
            "border",
            "rounded",
            "dark:bg-gray-700",
          ]);
          yield* on("input", (e) => {
            form.setValue("name", (e.target as HTMLInputElement).value);
          });
          yield* on("blur", () => form.setTouched("name"));
        });
        yield* reactive(() => {
          const state = formState();
          const error = state.errors.name;
          return error && state.touched.name
            ? [span(() => [clss(["text-red-500", "text-sm"]), text(error)])]
            : [];
        });
      });

      // Email field
      yield* div(function* () {
        yield* label(() => [
          clss(["block", "font-medium", "mb-1"]),
          text("Email"),
        ]);
        yield* input(function* () {
          yield* attr("type", "email");
          yield* attr("value", form.getValue("email") as string);
          yield* clss([
            "w-full",
            "px-3",
            "py-2",
            "border",
            "rounded",
            "dark:bg-gray-700",
          ]);
          yield* on("input", (e) => {
            form.setValue("email", (e.target as HTMLInputElement).value);
          });
          yield* on("blur", () => form.setTouched("email"));
        });
        yield* reactive(() => {
          const state = formState();
          const error = state.errors.email;
          return error && state.touched.email
            ? [span(() => [clss(["text-red-500", "text-sm"]), text(error)])]
            : [];
        });
      });

      // Message field
      yield* div(function* () {
        yield* label(() => [
          clss(["block", "font-medium", "mb-1"]),
          text("Message"),
        ]);
        yield* input(function* () {
          yield* attr("type", "text");
          yield* attr("value", form.getValue("message") as string);
          yield* clss([
            "w-full",
            "px-3",
            "py-2",
            "border",
            "rounded",
            "dark:bg-gray-700",
          ]);
          yield* on("input", (e) => {
            form.setValue("message", (e.target as HTMLInputElement).value);
          });
          yield* on("blur", () => form.setTouched("message"));
        });
        yield* reactive(() => {
          const state = formState();
          const error = state.errors.message;
          return error && state.touched.message
            ? [span(() => [clss(["text-red-500", "text-sm"]), text(error)])]
            : [];
        });
      });

      // Submit button
      yield* button(function* () {
        yield* clss([
          "w-full",
          "px-4",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "hover:bg-blue-600",
          "disabled:opacity-50",
        ]);
        yield* on("click", () => form.submit());
        yield* reactive(() => [
          text(formState().isSubmitting ? "Sending..." : "Send Message"),
        ]);
      });
    });
  });
};

/** 404 ページ */
const NotFoundPage: Component = () =>
  div(function* () {
    yield* clss(["p-6", "text-center"]);
    yield* h1(() => [
      clss(["text-4xl", "font-bold", "mb-4", "text-red-500"]),
      text("404"),
    ]);
    yield* p(() => [
      clss(["text-gray-600", "dark:text-gray-300"]),
      text("Page not found"),
    ]);
    yield* button(function* () {
      yield* clss([
        "mt-4",
        "px-4",
        "py-2",
        "bg-blue-500",
        "text-white",
        "rounded",
      ]);
      yield* on("click", () => navigate("/"));
      yield* text("Go Home");
    });
  });

// =============================================================================
// App
// =============================================================================

const App: Component = () =>
  div(function* () {
    // テーマに応じてダークモードクラスを適用
    yield* onMount(() => {
      const updateThemeClass = () => {
        if (currentTheme() === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };

      // 初期適用
      updateThemeClass();

      // テーマ変更を監視（シンプルな実装）
      const interval = setInterval(updateThemeClass, 100);
      return () => clearInterval(interval);
    });

    yield* clss([
      "min-h-screen",
      "bg-white",
      "dark:bg-gray-900",
      "dark:text-white",
    ]);

    yield* NavBar();

    yield* RouterView({
      routes: [
        { path: "/", component: HomePage },
        { path: "/users", component: UsersPage },
        { path: "/users/:id", component: UserDetailPage },
        { path: "/contact", component: ContactPage },
        { path: "*", component: NotFoundPage },
      ],
    });
  });

// =============================================================================
// Mount with Plugins
// =============================================================================

mount(App, document.getElementById("app")!, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
