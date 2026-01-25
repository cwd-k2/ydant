export type ValidationResult = string | null;
export type Validator = (value: unknown) => ValidationResult;

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string | null>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
}

export interface FormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validations?: Partial<Record<keyof T, Validator[]>>;
  onSubmit?: (values: T) => void;
}

export interface Form<T extends Record<string, unknown>> {
  getState(): FormState<T>;
  getValue<K extends keyof T>(field: K): T[K];
  setValue<K extends keyof T>(field: K, value: T[K]): void;
  setTouched<K extends keyof T>(field: K): void;
  submit(): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}
