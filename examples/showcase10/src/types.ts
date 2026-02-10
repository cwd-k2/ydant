export interface FormField {
  value: string;
  touched: boolean;
  error: string | null;
}

export type PasswordStrength = "weak" | "medium" | "strong";
