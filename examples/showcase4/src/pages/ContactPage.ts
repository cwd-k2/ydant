import type { Component } from "@ydant/core";
import { div, h1, p, span, button, input, label, text, attr, classes, on } from "@ydant/base";
import { signal, reactive } from "@ydant/reactive";
import { createForm, required, email, minLength } from "../form";

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

  return div(function* () {
    yield* classes("p-6", "max-w-md");
    yield* h1(() => [classes("text-2xl", "font-bold", "mb-4"), text("Contact")]);

    yield* p(() => [
      classes("text-sm", "text-gray-500", "mb-4"),
      text("This form uses user-implemented validation (not a library)."),
    ]);

    yield* div(function* () {
      yield* classes("space-y-4");

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
      yield* button(function* () {
        yield* classes(
          "w-full",
          "px-4",
          "py-2",
          "bg-blue-500",
          "text-white",
          "rounded",
          "hover:bg-blue-600",
          "disabled:opacity-50",
        );
        yield* on("click", () => form.submit());
        yield* reactive(() => [text(formState().isSubmitting ? "Sending..." : "Send Message")]);
      });
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
    yield* label(() => [classes("block", "font-medium", "mb-1"), text(labelText)]);
    yield* input(function* () {
      yield* attr("type", type);
      yield* attr("value", getValue());
      yield* classes("w-full", "px-3", "py-2", "border", "rounded", "dark:bg-gray-700");
      yield* on("input", (e) => {
        setValue((e.target as HTMLInputElement).value);
      });
      yield* on("blur", onBlur);
    });
    yield* reactive(() => {
      const error = getError();
      return error ? [span(() => [classes("text-red-500", "text-sm"), text(error)])] : [];
    });
  });
};
