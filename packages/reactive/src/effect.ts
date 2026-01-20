/**
 * Effect: 副作用（依存する Signal が変わると再実行）
 *
 * @example
 * ```typescript
 * const count = signal(0);
 *
 * const dispose = effect(() => {
 *   console.log(`Count is: ${count()}`);
 * });
 * // 出力: "Count is: 0"
 *
 * count.set(1);
 * // 出力: "Count is: 1"
 *
 * dispose();  // 購読解除
 * count.set(2);  // 何も出力されない
 * ```
 */

import { subscriberManager } from "./subscriber-manager";

/**
 * Effect を作成する
 *
 * @param fn - 副作用を実行する関数。クリーンアップ関数を返すことができる。
 * @returns Effect を破棄するための関数
 *
 * @example
 * ```typescript
 * const count = signal(0);
 *
 * // 基本的な使い方
 * const dispose = effect(() => {
 *   console.log(`Count changed to: ${count()}`);
 * });
 *
 * // クリーンアップ付き
 * const disposeTimer = effect(() => {
 *   const value = count();
 *   const timer = setTimeout(() => {
 *     console.log(`Delayed log: ${value}`);
 *   }, 1000);
 *
 *   // クリーンアップ: 次の実行前、または dispose 時に呼ばれる
 *   return () => clearTimeout(timer);
 * });
 * ```
 */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;
  let isDisposed = false;

  const execute = () => {
    if (isDisposed) return;

    // 前回のクリーンアップを実行
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }

    // 依存関係を追跡しながら実行
    cleanup = subscriberManager.runWith(execute, fn);
  };

  // 初回実行
  execute();

  // dispose 関数を返す
  return () => {
    if (!isDisposed) {
      isDisposed = true;
      if (cleanup) {
        cleanup();
        cleanup = undefined;
      }
    }
  };
}

/**
 * バッチ更新: 複数の Signal 更新を一度にまとめて通知する
 *
 * @param fn - バッチ内で実行する関数
 *
 * @example
 * ```typescript
 * const firstName = signal("John");
 * const lastName = signal("Doe");
 *
 * effect(() => {
 *   console.log(`${firstName()} ${lastName()}`);
 * });
 * // 出力: "John Doe"
 *
 * batch(() => {
 *   firstName.set("Jane");
 *   lastName.set("Smith");
 * });
 * // 出力: "Jane Smith" (1回だけ)
 * ```
 */
let batchDepth = 0;
let pendingEffects = new Set<() => void>();

export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const effects = pendingEffects;
      pendingEffects = new Set();
      for (const effect of effects) {
        effect();
      }
    }
  }
}

/**
 * 内部用: バッチ中かどうかを確認し、effect を遅延実行キューに追加
 */
export function scheduleEffect(effect: () => void): boolean {
  if (batchDepth > 0) {
    pendingEffects.add(effect);
    return true;
  }
  return false;
}
