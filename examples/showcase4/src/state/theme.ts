import { createStorage } from "@ydant/context";
import { signal } from "@ydant/reactive";
import type { Theme } from "../types";

// 永続化されたテーマ設定
const themeStorage = createStorage<Theme>("theme", "light");

// 現在のテーマ（Signal）
export const currentTheme = signal<Theme>(themeStorage.get());

// テーマを切り替える関数
export function toggleTheme(): void {
  const newTheme = currentTheme() === "light" ? "dark" : "light";
  currentTheme.set(newTheme);
  themeStorage.set(newTheme);
}

// document にダークモードクラスを適用
export function applyThemeToDocument(): void {
  if (currentTheme() === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
