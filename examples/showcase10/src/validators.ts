import type { PasswordStrength } from "./types";

export function validateUsername(value: string): string | null {
  if (!value) return "Username is required";
  if (value.length < 3) return "Username must be at least 3 characters";
  if (!/^[a-zA-Z0-9]+$/.test(value)) return "Username must be alphanumeric only";
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function validateConfirm(value: string, password: string): string | null {
  if (!value) return "Please confirm your password";
  if (value !== password) return "Passwords do not match";
  return null;
}

export function getPasswordStrength(value: string): PasswordStrength {
  if (!value || value.length < 8) return "weak";
  let score = 0;
  if (/[a-z]/.test(value)) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return score >= 3 ? "strong" : "medium";
}
