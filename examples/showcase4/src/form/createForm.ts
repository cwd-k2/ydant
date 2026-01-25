import type { Form, FormState, FormOptions, Validator } from "./types";

/**
 * シンプルなフォーム状態管理
 * ユーザー実装例として、ライブラリを使用せずにフォームを管理
 */
export function createForm<T extends Record<string, unknown>>(options: FormOptions<T>): Form<T> {
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
