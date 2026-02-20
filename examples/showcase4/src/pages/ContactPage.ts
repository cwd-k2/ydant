import type { Component } from "@ydant/core";
import { html, text } from "@ydant/base";
import { signal, reactive } from "@ydant/reactive";
import { createForm, required, email, minLength } from "../form";

const { div, h1, p, span, button, input, label } = html;

/**
 * コンタクトフォームページ
 * ユーザー実装のフォームバリデーション例
 */
export const ContactPage: Component = () => {
  // フォーム状態の作成
  const form = createForm({
    initialValues: {
      name: "",
      email: "",
      message: "",
    },
    validations: {
      name: [required("Name is required"), minLength(2, "Min 2 characters")],
      email: [required("Email is required"), email("Invalid email")],
      message: [required("Message is required"), minLength(10, "Min 10 characters")],
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

  return div({ class: "p-6 max-w-md" }, function* () {
    yield* h1({ class: "text-2xl font-bold mb-4" }, "Contact");

    yield* p(
      { class: "text-sm text-gray-500 dark:text-gray-400 mb-4" },
      "This form uses user-implemented validation (not a library).",
    );

    yield* div({ class: "space-y-4" }, function* () {
      // Name field
      yield* FormField({
        labelText: "Name",
        type: "text",
        getValue: () => form.getValue("name") as string,
        setValue: (v) => form.setValue("name", v),
        onBlur: () => form.setTouched("name"),
        getError: () => {
          const state = formState();
          return state.touched.name ? state.errors.name : null;
        },
      });

      // Email field
      yield* FormField({
        labelText: "Email",
        type: "email",
        getValue: () => form.getValue("email") as string,
        setValue: (v) => form.setValue("email", v),
        onBlur: () => form.setTouched("email"),
        getError: () => {
          const state = formState();
          return state.touched.email ? state.errors.email : null;
        },
      });

      // Message field
      yield* FormField({
        labelText: "Message",
        type: "text",
        getValue: () => form.getValue("message") as string,
        setValue: (v) => form.setValue("message", v),
        onBlur: () => form.setTouched("message"),
        getError: () => {
          const state = formState();
          return state.touched.message ? state.errors.message : null;
        },
      });

      // Submit button
      yield* button(
        {
          class:
            "w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50",
          onClick: () => form.submit(),
        },
        function* () {
          yield* reactive(() => [text(formState().isSubmitting ? "Sending..." : "Send Message")]);
        },
      );
    });
  });
};

// フォームフィールドコンポーネント
interface FormFieldProps {
  labelText: string;
  type: string;
  getValue: () => string;
  setValue: (value: string) => void;
  onBlur: () => void;
  getError: () => string | null | undefined;
}

const FormField: Component<FormFieldProps> = (props) => {
  const { labelText, type, getValue, setValue, onBlur, getError } = props;

  return div(function* () {
    yield* label({ class: "block font-medium mb-1" }, labelText);
    yield* input({
      type,
      value: getValue(),
      class:
        "w-full px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200",
      onInput: (e: Event) => {
        setValue((e.target as HTMLInputElement).value);
      },
      onBlur,
    });
    yield* reactive(() => {
      const error = getError();
      return error ? [span({ class: "text-red-500 text-sm" }, error)] : [];
    });
  });
};
