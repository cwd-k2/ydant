/**
 * 購読者管理
 *
 * effect/computed 実行中の購読者を追跡する。
 * モジュールシステムによりシングルトンが保証される。
 */

import type { Subscriber } from "./types";

class SubscriberManager {
  private current: Subscriber | null = null;

  /** 現在の購読者を取得 */
  get(): Subscriber | null {
    return this.current;
  }

  /** 購読者を設定して関数を実行（終了後に元に戻す） */
  runWith<T>(subscriber: Subscriber, fn: () => T): T {
    const prev = this.current;
    this.current = subscriber;
    try {
      return fn();
    } finally {
      this.current = prev;
    }
  }
}

/** 購読者管理シングルトン */
export const subscriberManager = new SubscriberManager();
