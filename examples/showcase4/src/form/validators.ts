import type { Validator } from "./types";

/** 必須バリデータ */
export function required(message = "This field is required"): Validator {
  return (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return message;
    }
    return null;
  };
}

/** メールバリデータ */
export function email(message = "Invalid email address"): Validator {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value: unknown) => {
    if (typeof value !== "string" || !value) return null;
    return emailRegex.test(value) ? null : message;
  };
}

/** 最小文字数バリデータ */
export function minLength(min: number, message?: string): Validator {
  return (value: unknown) => {
    if (typeof value !== "string" || !value) return null;
    return value.length >= min ? null : message || `Minimum ${min} characters required`;
  };
}

/** 最大文字数バリデータ */
export function maxLength(max: number, message?: string): Validator {
  return (value: unknown) => {
    if (typeof value !== "string" || !value) return null;
    return value.length <= max ? null : message || `Maximum ${max} characters allowed`;
  };
}
