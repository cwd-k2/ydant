import type { Component, Render } from "@ydant/core";
import type { FormField, PasswordStrength } from "./types";
import {
  div,
  h1,
  span,
  p,
  button,
  input,
  label,
  form,
  text,
  classes,
  on,
  attr,
  createSlotRef,
} from "@ydant/base";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateConfirm,
  getPasswordStrength,
} from "./validators";

type Validator = (value: string) => string | null;

const STRENGTH_COLORS: Record<PasswordStrength, { bar: string; label: string }> = {
  weak: { bar: "bg-red-400", label: "Weak" },
  medium: { bar: "bg-yellow-400", label: "Medium" },
  strong: { bar: "bg-green-400", label: "Strong" },
};

const STRENGTH_WIDTH: Record<PasswordStrength, string> = {
  weak: "w-1/3",
  medium: "w-2/3",
  strong: "w-full",
};

/**
 * Form Validation App
 *
 * SlotRef のみで実現する細粒度フォームバリデーション。
 * reactive プラグインなし、base パッケージのみの最小構成。
 */
export const App: Component = () =>
  div(function* () {
    yield* classes("max-w-md", "mx-auto", "p-6");
    yield* h1(() => [classes("text-2xl", "font-bold", "mb-6"), text("User Registration")]);

    // --- Field State ---
    const fields: Record<string, FormField> = {
      username: { value: "", touched: false, error: null },
      email: { value: "", touched: false, error: null },
      password: { value: "", touched: false, error: null },
      confirm: { value: "", touched: false, error: null },
    };

    // --- SlotRefs ---
    const errorRefs = {
      username: createSlotRef(),
      email: createSlotRef(),
      password: createSlotRef(),
      confirm: createSlotRef(),
    };
    const strengthRef = createSlotRef();
    const summaryRef = createSlotRef();

    // --- Validation ---
    function validateField(name: string, validator: Validator): void {
      const field = fields[name];
      field.error = validator(field.value);
      errorRefs[name as keyof typeof errorRefs].refresh(renderError(field.error));
    }

    function validateAll(): boolean {
      fields.username.error = validateUsername(fields.username.value);
      fields.email.error = validateEmail(fields.email.value);
      fields.password.error = validatePassword(fields.password.value);
      fields.confirm.error = validateConfirm(fields.confirm.value, fields.password.value);

      for (const name of Object.keys(errorRefs)) {
        const field = fields[name];
        field.touched = true;
        errorRefs[name as keyof typeof errorRefs].refresh(renderError(field.error));
      }

      return Object.values(fields).every((f) => f.error === null);
    }

    function handleInput(name: string, validator: Validator, el: HTMLInputElement): void {
      fields[name].value = el.value;
      if (fields[name].touched) {
        validateField(name, validator);
      }
      // password 入力時は強度メーターも更新
      if (name === "password") {
        strengthRef.refresh(renderStrength(getPasswordStrength(el.value)));
        // confirm フィールドも再検証（パスワード変更時）
        if (fields.confirm.touched) {
          fields.confirm.error = validateConfirm(fields.confirm.value, el.value);
          errorRefs.confirm.refresh(renderError(fields.confirm.error));
        }
      }
    }

    function handleBlur(name: string, validator: Validator): void {
      fields[name].touched = true;
      validateField(name, validator);
    }

    // --- Render Helpers ---
    function renderError(error: string | null): () => Render {
      return function* () {
        if (error) {
          yield* text(error);
          yield* classes("text-red-500", "text-sm", "mt-1");
        }
      };
    }

    function renderStrength(strength: PasswordStrength): () => Render {
      const c = STRENGTH_COLORS[strength];
      const w = STRENGTH_WIDTH[strength];
      return function* () {
        if (!fields.password.value) return;
        yield* classes("mt-2");
        yield* div(() => [
          classes("h-2", "bg-gray-200", "rounded-full", "overflow-hidden"),
          div(() => [
            classes("h-full", "rounded-full", "transition-all", "duration-300", c.bar, w),
          ]),
        ]);
        yield* span(() => [classes("text-xs", "text-gray-500", "mt-1"), text(c.label)]);
      };
    }

    // --- Form ---
    yield* form(function* () {
      yield* classes("space-y-5", "bg-white", "p-6", "rounded-lg", "shadow");
      yield* on("submit", (e) => {
        e.preventDefault();
        const valid = validateAll();
        if (valid) {
          summaryRef.refresh(function* () {
            yield* classes("p-4", "bg-green-50", "border", "border-green-300", "rounded");
            yield* p(() => [
              classes("text-green-700", "font-medium"),
              text("Registration successful!"),
            ]);
          });
        } else {
          const errors = Object.entries(fields)
            .filter(([, f]) => f.error)
            .map(([name, f]) => `${name}: ${f.error}`);
          summaryRef.refresh(function* () {
            yield* classes("p-4", "bg-red-50", "border", "border-red-300", "rounded");
            yield* p(() => [
              classes("text-red-700", "font-medium", "mb-2"),
              text("Please fix the following errors:"),
            ]);
            for (const err of errors) {
              yield* p(() => [classes("text-red-600", "text-sm"), text(err)]);
            }
          });
        }
      });

      // Username
      yield* FormFieldGroup({
        label: "Username",
        type: "text",
        placeholder: "Enter username",
        errorRef: errorRefs.username,
        onInput: (el) => handleInput("username", validateUsername, el),
        onBlur: () => handleBlur("username", validateUsername),
      });

      // Email
      yield* FormFieldGroup({
        label: "Email",
        type: "email",
        placeholder: "Enter email",
        errorRef: errorRefs.email,
        onInput: (el) => handleInput("email", validateEmail, el),
        onBlur: () => handleBlur("email", validateEmail),
      });

      // Password
      yield* div(function* () {
        yield* label(() => [
          classes("block", "text-sm", "font-medium", "text-gray-700", "mb-1"),
          text("Password"),
        ]);
        yield* input(function* () {
          yield* attr("type", "password");
          yield* attr("placeholder", "Enter password (8+ characters)");
          yield* classes(
            "w-full",
            "px-3",
            "py-2",
            "border",
            "rounded",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-blue-300",
          );
          yield* on("input", (e) =>
            handleInput("password", validatePassword, e.target as HTMLInputElement),
          );
          yield* on("blur", () => handleBlur("password", validatePassword));
        });
        errorRefs.password.bind(yield* p(renderError(null)));
        strengthRef.bind(yield* div(renderStrength("weak")));
      });

      // Confirm Password
      yield* FormFieldGroup({
        label: "Confirm Password",
        type: "password",
        placeholder: "Re-enter password",
        errorRef: errorRefs.confirm,
        onInput: (el) =>
          handleInput("confirm", (v) => validateConfirm(v, fields.password.value), el),
        onBlur: () => handleBlur("confirm", (v) => validateConfirm(v, fields.password.value)),
      });

      // Submit
      yield* button(function* () {
        yield* attr("type", "submit");
        yield* classes(
          "w-full",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "font-medium",
          "hover:bg-blue-600",
          "transition-colors",
        );
        yield* text("Register");
      });

      // Summary
      summaryRef.bind(yield* div(() => []));
    });
  });

// --- Reusable Form Field ---

interface FormFieldGroupProps {
  label: string;
  type: string;
  placeholder: string;
  errorRef: ReturnType<typeof createSlotRef>;
  onInput: (el: HTMLInputElement) => void;
  onBlur: () => void;
}

function FormFieldGroup(props: FormFieldGroupProps): Render {
  return div(function* () {
    yield* label(() => [
      classes("block", "text-sm", "font-medium", "text-gray-700", "mb-1"),
      text(props.label),
    ]);
    yield* input(function* () {
      yield* attr("type", props.type);
      yield* attr("placeholder", props.placeholder);
      yield* classes(
        "w-full",
        "px-3",
        "py-2",
        "border",
        "rounded",
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-blue-300",
      );
      yield* on("input", (e) => props.onInput(e.target as HTMLInputElement));
      yield* on("blur", props.onBlur);
    });
    props.errorRef.bind(yield* p(renderEmptyError()));
  });
}

function renderEmptyError(): () => Render {
  return function* () {
    // empty - no error initially
  };
}
