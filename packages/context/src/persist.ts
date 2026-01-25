/**
 * 永続化ヘルパー
 *
 * localStorage を使って値を永続化する。
 *
 * @example
 * ```typescript
 * import { createStorage } from "@ydant/context";
 *
 * // ストレージを作成
 * const themeStorage = createStorage<"light" | "dark">("theme", "light");
 *
 * // 読み込み
 * const theme = themeStorage.get();
 *
 * // 保存
 * themeStorage.set("dark");
 *
 * // 削除
 * themeStorage.clear();
 * ```
 */

/**
 * localStorage から値を取得し、存在しなければデフォルト値を返す
 *
 * @param key - localStorage のキー
 * @param defaultValue - 値が存在しない場合のデフォルト値
 */
export function persist<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined" || !window.localStorage) {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * localStorage に値を保存する
 *
 * @param key - localStorage のキー
 * @param value - 保存する値
 */
export function save<T>(key: string, value: T): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage が使用できない場合は何もしない
  }
}

/**
 * localStorage から値を削除する
 *
 * @param key - localStorage のキー
 */
export function remove(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage が使用できない場合は何もしない
  }
}

/**
 * 永続化された状態を管理するヘルパー
 *
 * 状態の取得・設定・削除を一元管理する。
 *
 * @example
 * ```typescript
 * const todoStorage = createStorage<Todo[]>("todos", []);
 *
 * // 読み込み
 * const todos = todoStorage.get();
 *
 * // 保存
 * todoStorage.set([...todos, newTodo]);
 *
 * // 削除
 * todoStorage.clear();
 * ```
 */
export function createStorage<T>(
  key: string,
  defaultValue: T
): {
  get: () => T;
  set: (value: T) => void;
  clear: () => void;
} {
  return {
    get: () => persist(key, defaultValue),
    set: (value: T) => save(key, value),
    clear: () => remove(key),
  };
}
