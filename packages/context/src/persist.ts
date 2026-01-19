/**
 * 永続化ヘルパー
 *
 * localStorage を使って値を永続化する。
 *
 * @example
 * ```typescript
 * import { persist, createPersistedSignal } from "@ydant/context";
 * import { signal } from "@ydant/reactive";
 *
 * // 初期値を localStorage から取得（なければデフォルト値）
 * const theme = persist("theme", "light");
 *
 * // Signal と組み合わせる場合
 * const count = createPersistedSignal("count", 0);
 * count.set(10);  // localStorage にも保存される
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
 * 永続化された Signal を作成するためのヘルパー
 *
 * @ydant/reactive の signal と組み合わせて使用する。
 * 値が変更されるたびに自動的に localStorage に保存される。
 *
 * 注意: この関数は @ydant/reactive に依存しないため、
 * Signal の作成は呼び出し側で行う必要がある。
 *
 * @example
 * ```typescript
 * import { signal } from "@ydant/reactive";
 * import { createPersistedValue } from "@ydant/context";
 *
 * // 初期値の取得と保存関数を作成
 * const { initialValue, save } = createPersistedValue("count", 0);
 *
 * // Signal を作成
 * const count = signal(initialValue);
 *
 * // 更新時に保存
 * function setCount(value: number) {
 *   count.set(value);
 *   save(value);
 * }
 * ```
 */
export function createPersistedValue<T>(
  key: string,
  defaultValue: T
): {
  initialValue: T;
  save: (value: T) => void;
  remove: () => void;
} {
  return {
    initialValue: persist(key, defaultValue),
    save: (value: T) => save(key, value),
    remove: () => remove(key),
  };
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
