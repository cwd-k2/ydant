/**
 * Form
 *
 * フォームの状態管理とバリデーション。
 *
 * @example
 * ```typescript
 * import { createForm, required, email, minLength } from "@ydant/form";
 *
 * const form = createForm({
 *   initialValues: {
 *     email: "",
 *     password: "",
 *   },
 *   validations: {
 *     email: [required("Email is required"), email("Invalid email")],
 *     password: [required("Password is required"), minLength(8, "Min 8 characters")],
 *   },
 *   onSubmit: async (values) => {
 *     await login(values);
 *   },
 * });
 * ```
 */

import type { Validator, ValidationResult } from "./validators";

/** フォームのフィールド状態 */
export interface FieldState<T> {
  /** フィールドの値 */
  value: T;
  /** エラーメッセージ */
  error: string | null;
  /** フィールドに触れたかどうか */
  touched: boolean;
  /** 値が変更されたかどうか */
  dirty: boolean;
}

/** フォームの状態 */
export interface FormState<T extends Record<string, unknown>> {
  /** フィールドの値 */
  values: T;
  /** フィールドごとのエラー */
  errors: Partial<Record<keyof T, string | null>>;
  /** フィールドごとの touched 状態 */
  touched: Partial<Record<keyof T, boolean>>;
  /** フォームが有効かどうか */
  isValid: boolean;
  /** サブミット中かどうか */
  isSubmitting: boolean;
  /** サブミットされたかどうか */
  isSubmitted: boolean;
}

/** createForm のオプション */
export interface CreateFormOptions<T extends Record<string, unknown>> {
  /** 初期値 */
  initialValues: T;
  /** フィールドごとのバリデータ */
  validations?: Partial<Record<keyof T, Validator<unknown>[]>>;
  /** サブミット時のコールバック */
  onSubmit?: (values: T) => void | Promise<void>;
  /** 値変更時のコールバック */
  onChange?: (values: T) => void;
}

/** フォームインスタンス */
export interface FormInstance<T extends Record<string, unknown>> {
  /** 現在の状態を取得 */
  getState(): FormState<T>;
  /** フィールドの値を取得 */
  getValue<K extends keyof T>(field: K): T[K];
  /** フィールドの値を設定 */
  setValue<K extends keyof T>(field: K, value: T[K]): void;
  /** フィールドのエラーを取得 */
  getError<K extends keyof T>(field: K): string | null;
  /** フィールドを touched にする */
  setTouched<K extends keyof T>(field: K): void;
  /** 単一フィールドをバリデート */
  validateField<K extends keyof T>(field: K): ValidationResult;
  /** 全フィールドをバリデート */
  validate(): boolean;
  /** フォームをサブミット */
  submit(): Promise<void>;
  /** フォームをリセット */
  reset(): void;
  /** フォームの変更をサブスクライブ */
  subscribe(listener: () => void): () => void;
}

/**
 * フォームインスタンスを作成
 */
export function createForm<T extends Record<string, unknown>>(
  options: CreateFormOptions<T>
): FormInstance<T> {
  const { initialValues, validations = {}, onSubmit, onChange } = options;

  // 内部状態
  let values: T = { ...initialValues };
  let errors: Partial<Record<keyof T, string | null>> = {};
  let touched: Partial<Record<keyof T, boolean>> = {};
  let isSubmitting = false;
  let isSubmitted = false;

  // サブスクライバー
  const listeners = new Set<() => void>();

  // 変更を通知
  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
    if (onChange) {
      onChange(values);
    }
  };

  // フィールドをバリデート
  const validateField = <K extends keyof T>(field: K): ValidationResult => {
    const fieldValidators = validations[field];
    if (!fieldValidators) {
      return null;
    }

    for (const validator of fieldValidators) {
      const result = validator(values[field]);
      if (result) {
        return result;
      }
    }
    return null;
  };

  // フォームが有効かどうかをチェック
  const checkIsValid = (): boolean => {
    for (const field of Object.keys(values) as (keyof T)[]) {
      const error = validateField(field);
      if (error) {
        return false;
      }
    }
    return true;
  };

  return {
    getState(): FormState<T> {
      return {
        values: { ...values },
        errors: { ...errors },
        touched: { ...touched },
        isValid: checkIsValid(),
        isSubmitting,
        isSubmitted,
      };
    },

    getValue<K extends keyof T>(field: K): T[K] {
      return values[field];
    },

    setValue<K extends keyof T>(field: K, value: T[K]): void {
      values[field] = value;
      errors[field] = validateField(field);
      notify();
    },

    getError<K extends keyof T>(field: K): string | null {
      return errors[field] ?? null;
    },

    setTouched<K extends keyof T>(field: K): void {
      touched[field] = true;
      errors[field] = validateField(field);
      notify();
    },

    validateField,

    validate(): boolean {
      let isValid = true;
      for (const field of Object.keys(values) as (keyof T)[]) {
        const error = validateField(field);
        errors[field] = error;
        if (error) {
          isValid = false;
        }
      }
      notify();
      return isValid;
    },

    async submit(): Promise<void> {
      // 全フィールドを touched にする
      for (const field of Object.keys(values) as (keyof T)[]) {
        touched[field] = true;
      }

      // バリデーション
      const isValid = this.validate();
      if (!isValid) {
        return;
      }

      if (!onSubmit) {
        return;
      }

      isSubmitting = true;
      notify();

      try {
        await onSubmit(values);
        isSubmitted = true;
      } finally {
        isSubmitting = false;
        notify();
      }
    },

    reset(): void {
      values = { ...initialValues };
      errors = {};
      touched = {};
      isSubmitting = false;
      isSubmitted = false;
      notify();
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
