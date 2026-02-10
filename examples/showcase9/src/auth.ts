import type { User } from "./types";

let currentUser: User | null = null;

export function login(name: string, role: "admin" | "viewer" = "admin"): void {
  currentUser = { name, role };
}

export function logout(): void {
  currentUser = null;
}

export function isLoggedIn(): boolean {
  return currentUser !== null;
}

export function getUser(): User | null {
  return currentUser;
}

/**
 * Simulates an async permission check (e.g. server-side verification).
 * Resolves after a short delay.
 */
export async function checkAdminPermission(): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 500));
  return currentUser?.role === "admin";
}
