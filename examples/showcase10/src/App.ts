import type { Component, Render } from "@ydant/core";
import type { Slot } from "@ydant/base";
import type { FormField, PasswordStrength } from "./types";
import { div, h1, span, p, button, input, label, form, refresh } from "@ydant/base";
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
  div({ class: "max-w-md mx-auto p-6" }, function* () {
    yield* h1({ class: "text-2xl font-bold mb-6" }, "User Registration");

    // --- Field State ---
    const fields: Record<string, FormField> = {
      username: { value: "", touched: false, error: null },
      email: { value: "", touched: false, error: null },
      password: { value: "", touched: false, error: null },
      confirm: { value: "", touched: false, error: null },
    };

    // --- Slot references ---
    const errorSlots: Record<string, Slot> = {};
    let strengthSlot: Slot;
    let summarySlot: Slot;

    // --- Validation ---
    function validateField(name: string, validator: Validator): void {
      const field = fields[name];
      field.error = validator(field.value);
      if (errorSlots[name]) refresh(errorSlots[name], renderError(field.error));
    }

    function validateAll(): boolean {
      fields.username.error = validateUsername(fields.username.value);
      fields.email.error = validateEmail(fields.email.value);
      fields.password.error = validatePassword(fields.password.value);
      fields.confirm.error = validateConfirm(fields.confirm.value, fields.password.value);

      for (const name of Object.keys(errorSlots)) {
        const field = fields[name];
        field.touched = true;
        if (errorSlots[name]) refresh(errorSlots[name], renderError(field.error));
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
        refresh(strengthSlot, renderStrength(getPasswordStrength(el.value)));
        // confirm フィールドも再検証（パスワード変更時）
        if (fields.confirm.touched) {
          fields.confirm.error = validateConfirm(fields.confirm.value, el.value);
          if (errorSlots.confirm) refresh(errorSlots.confirm, renderError(fields.confirm.error));
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
          yield* span({ class: "text-red-500 text-sm mt-1" }, error);
        }
      };
    }

    function renderStrength(strength: PasswordStrength): () => Render {
      const c = STRENGTH_COLORS[strength];
      const w = STRENGTH_WIDTH[strength];
      return function* () {
        if (!fields.password.value) return;
        yield* div({ class: "h-2 bg-slate-700 rounded-full overflow-hidden mt-2" }, function* () {
          yield* div({ class: `h-full rounded-full transition-all duration-300 ${c.bar} ${w}` });
        });
        yield* span({ class: "text-xs text-gray-400 mt-1" }, c.label);
      };
    }

    // --- Form ---
    yield* form(
      {
        class: "space-y-5 bg-slate-800 p-6 rounded-lg border border-slate-700",
        onSubmit: (e) => {
          e.preventDefault();
          const valid = validateAll();
          if (valid) {
            refresh(summarySlot, function* () {
              yield* p(
                { class: "p-4 bg-green-900/30 border border-green-700 rounded" },
                function* () {
                  yield* span({ class: "text-green-400 font-medium" }, "Registration successful!");
                },
              );
            });
          } else {
            const errors = Object.entries(fields)
              .filter(([, f]) => f.error)
              .map(([name, f]) => `${name}: ${f.error}`);
            refresh(summarySlot, function* () {
              yield* div(
                { class: "p-4 bg-red-900/30 border border-red-700 rounded" },
                function* () {
                  yield* p(
                    { class: "text-red-400 font-medium mb-2" },
                    "Please fix the following errors:",
                  );
                  for (const err of errors) {
                    yield* p({ class: "text-red-300 text-sm" }, err);
                  }
                },
              );
            });
          }
        },
      },
      function* () {
        // Username
        yield* FormFieldGroup({
          label: "Username",
          type: "text",
          placeholder: "Enter username",
          onSlotReady: (s) => (errorSlots.username = s),
          onInput: (el) => handleInput("username", validateUsername, el),
          onBlur: () => handleBlur("username", validateUsername),
        });

        // Email
        yield* FormFieldGroup({
          label: "Email",
          type: "email",
          placeholder: "Enter email",
          onSlotReady: (s) => (errorSlots.email = s),
          onInput: (el) => handleInput("email", validateEmail, el),
          onBlur: () => handleBlur("email", validateEmail),
        });

        // Password
        yield* div({}, function* () {
          yield* label({ class: "block text-sm font-medium text-gray-300 mb-1" }, "Password");
          yield* input({
            type: "password",
            placeholder: "Enter password (8+ characters)",
            class:
              "w-full px-3 py-2 border border-slate-600 bg-slate-700 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300",
            onInput: (e) => handleInput("password", validatePassword, e.target as HTMLInputElement),
            onBlur: () => handleBlur("password", validatePassword),
          });
          errorSlots.password = yield* p(renderError(null));
          strengthSlot = yield* div(renderStrength("weak"));
        });

        // Confirm Password
        yield* FormFieldGroup({
          label: "Confirm Password",
          type: "password",
          placeholder: "Re-enter password",
          onSlotReady: (s) => (errorSlots.confirm = s),
          onInput: (el) =>
            handleInput("confirm", (v) => validateConfirm(v, fields.password.value), el),
          onBlur: () => handleBlur("confirm", (v) => validateConfirm(v, fields.password.value)),
        });

        // Submit
        yield* button(
          {
            type: "submit",
            class:
              "w-full py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors",
          },
          "Register",
        );

        // Summary
        summarySlot = yield* div(() => []);
      },
    );
  });

// --- Reusable Form Field ---

interface FormFieldGroupProps {
  label: string;
  type: string;
  placeholder: string;
  onSlotReady: (slot: Slot) => void;
  onInput: (el: HTMLInputElement) => void;
  onBlur: () => void;
}

function FormFieldGroup(props: FormFieldGroupProps): Render {
  return div({}, function* () {
    yield* label({ class: "block text-sm font-medium text-gray-300 mb-1" }, props.label);
    yield* input({
      type: props.type,
      placeholder: props.placeholder,
      class:
        "w-full px-3 py-2 border border-slate-600 bg-slate-700 text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300",
      onInput: (e) => props.onInput(e.target as HTMLInputElement),
      onBlur: props.onBlur,
    });
    props.onSlotReady(yield* p(() => []));
  });
}
