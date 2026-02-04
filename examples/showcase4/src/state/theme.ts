import { signal } from "@ydant/reactive";
import type { Theme } from "../types";

// localStorage ラッパー
function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === '"light"' || stored === '"dark"') {
      return JSON.parse(stored) as Theme;
    }
  } catch {
    // localStorage が使用できない場合は無視
  }
  return "light";
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem("theme", JSON.stringify(theme));
  } catch {
    // localStorage が使用できない場合は無視
  }
}

// 現在のテーマ（Signal）
export const currentTheme = signal<Theme>(loadTheme());

// テーマを切り替える関数
export function toggleTheme(): void {
  const newTheme = currentTheme() === "light" ? "dark" : "light";
  currentTheme.set(newTheme);
  saveTheme(newTheme);
}

// document にダークモードクラスを適用
export function applyThemeToDocument(): void {
  if (currentTheme() === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
