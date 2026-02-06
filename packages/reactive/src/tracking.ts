/**
 * 購読者管理
 *
 * effect/computed 実行中の購読者を追跡する。
 *
 * NOTE: current はモジュールレベルのグローバル状態。
 * runWithSubscriber で適切にスタック管理されるが、
 * テスト間での分離には __resetForTesting__() を使用。
 */

import type { Subscriber } from "./types";

let current: Subscriber | null = null;

/**
 * テスト用: 状態をリセット
 * @internal
 */
export function __resetForTesting__(): void {
  current = null;
}

/** 現在の購読者を取得 */
export function getCurrentSubscriber(): Subscriber | null {
  return current;
}

/** 購読者を設定して関数を実行（終了後に元に戻す） */
export function runWithSubscriber<T>(subscriber: Subscriber, fn: () => T): T {
  const prev = current;
  current = subscriber;
  try {
    return fn();
  } finally {
    current = prev;
  }
}
