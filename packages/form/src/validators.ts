/**
 * バリデーション関数
 *
 * フォームフィールドの検証に使用するバリデータ。
 */

/** バリデーション結果 */
export type ValidationResult = string | null;

/** バリデータ関数 */
export type Validator<T = unknown> = (value: T) => ValidationResult;

/**
 * 必須フィールドバリデータ
 *
 * @param message - エラーメッセージ
 */
export function required(message = "This field is required"): Validator<unknown> {
  return (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return message;
    }
    if (Array.isArray(value) && value.length === 0) {
      return message;
    }
    return null;
  };
}

/**
 * メールアドレスバリデータ
 *
 * @param message - エラーメッセージ
 */
export function email(message = "Invalid email address"): Validator<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value: string) => {
    if (!value) return null;
    return emailRegex.test(value) ? null : message;
  };
}

/**
 * 最小文字数バリデータ
 *
 * @param min - 最小文字数
 * @param message - エラーメッセージ
 */
export function minLength(
  min: number,
  message?: string
): Validator<string> {
  return (value: string) => {
    if (!value) return null;
    return value.length >= min ? null : (message || `Minimum ${min} characters required`);
  };
}

/**
 * 最大文字数バリデータ
 *
 * @param max - 最大文字数
 * @param message - エラーメッセージ
 */
export function maxLength(
  max: number,
  message?: string
): Validator<string> {
  return (value: string) => {
    if (!value) return null;
    return value.length <= max ? null : (message || `Maximum ${max} characters allowed`);
  };
}

/**
 * 正規表現バリデータ
 *
 * @param regex - 正規表現
 * @param message - エラーメッセージ
 */
export function pattern(
  regex: RegExp,
  message = "Invalid format"
): Validator<string> {
  return (value: string) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  };
}

/**
 * 最小値バリデータ（数値）
 *
 * @param min - 最小値
 * @param message - エラーメッセージ
 */
export function min(
  minValue: number,
  message?: string
): Validator<number> {
  return (value: number) => {
    if (value === null || value === undefined) return null;
    return value >= minValue ? null : (message || `Minimum value is ${minValue}`);
  };
}

/**
 * 最大値バリデータ（数値）
 *
 * @param max - 最大値
 * @param message - エラーメッセージ
 */
export function max(
  maxValue: number,
  message?: string
): Validator<number> {
  return (value: number) => {
    if (value === null || value === undefined) return null;
    return value <= maxValue ? null : (message || `Maximum value is ${maxValue}`);
  };
}

/**
 * カスタムバリデータ
 *
 * @param validator - バリデーション関数
 */
export function custom<T>(
  validator: (value: T) => boolean,
  message: string
): Validator<T> {
  return (value: T) => {
    return validator(value) ? null : message;
  };
}

/**
 * 複数のバリデータを組み合わせる
 *
 * @param validators - バリデータの配列
 */
export function compose<T>(
  ...validators: Validator<T>[]
): Validator<T> {
  return (value: T) => {
    for (const validator of validators) {
      const result = validator(value);
      if (result) {
        return result;
      }
    }
    return null;
  };
}
