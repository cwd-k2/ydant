/**
 * @ydant/form
 *
 * フォーム管理とバリデーション
 */

export { createForm } from "./form";
export type {
  FieldState,
  FormState,
  CreateFormOptions,
  FormInstance,
} from "./form";

export {
  required,
  email,
  minLength,
  maxLength,
  pattern,
  min,
  max,
  custom,
  compose,
} from "./validators";
export type { Validator, ValidationResult } from "./validators";
