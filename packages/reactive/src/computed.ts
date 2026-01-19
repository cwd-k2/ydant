/**
 * Computed: 派生値（依存する Signal が変わると再計算）
 *
 * @example
 * ```typescript
 * const count = signal(5);
 * const doubled = computed(() => count() * 2);
 * console.log(doubled());  // 10
 * count.set(10);
 * console.log(doubled());  // 20
 * ```
 */

import { runWithSubscriber } from "./signal";

/** Computed インターフェース（読み取り専用） */
export interface Computed<T> {
  /** 値を読み取る */
  (): T;
  /** 現在の値を取得（購読なし） */
  peek(): T;
}

/**
 * Computed を作成する
 *
 * @param fn - 派生値を計算する関数
 * @returns Computed オブジェクト
 *
 * @example
 * ```typescript
 * const firstName = signal("John");
 * const lastName = signal("Doe");
 * const fullName = computed(() => `${firstName()} ${lastName()}`);
 *
 * console.log(fullName());  // "John Doe"
 *
 * firstName.set("Jane");
 * console.log(fullName());  // "Jane Doe"
 * ```
 */
export function computed<T>(fn: () => T): Computed<T> {
  let cachedValue: T;
  let isDirty = true;
  let subscribers = new Set<() => void>();

  // この computed 自身が購読者として依存関係を追跡
  const recompute = () => {
    isDirty = true;
    // 購読者に通知
    for (const sub of subscribers) {
      sub();
    }
  };

  const read = (() => {
    // 現在の購読者がいれば登録
    const currentSub = getCurrentSubscriber();
    if (currentSub) {
      subscribers.add(currentSub);
    }

    if (isDirty) {
      // 依存関係を追跡しながら再計算
      cachedValue = runWithSubscriber(recompute, fn);
      isDirty = false;
    }

    return cachedValue;
  }) as Computed<T>;

  read.peek = () => {
    if (isDirty) {
      cachedValue = fn();
      isDirty = false;
    }
    return cachedValue;
  };

  return read;
}

// signal.ts から getCurrentSubscriber をインポートする代わりに、
// signal.ts からエクスポートして使用
import { getCurrentSubscriber } from "./signal";
