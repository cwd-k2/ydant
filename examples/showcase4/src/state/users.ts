import { signal } from "@ydant/reactive";
import type { User } from "../types";

// ユーザーリスト（Signal）
export const users = signal<User[]>([
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" },
]);

// ユーザーを追加
export function addUser(name: string, email: string): void {
  const id = Date.now();
  users.update((list) => [...list, { id, name, email }]);
}

// ユーザーを削除
export function removeUser(id: number): void {
  users.update((list) => list.filter((u) => u.id !== id));
}

// ユーザーを検索
export function findUser(id: number): User | undefined {
  return users().find((u) => u.id === id);
}
