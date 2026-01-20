/**
 * Signal: 単一の値を保持するリアクティブコンテナ
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * console.log(count());  // 0
 * count.set(1);
 * console.log(count());  // 1
 * count.update(n => n + 1);
 * console.log(count());  // 2
 * ```
 */

type Subscriber = () => void;

/**
 * 購読者管理のシングルトン
 *
 * effect/computed 実行中の購読者を追跡する。
 * モジュールトップレベル変数を避け、状態を明示的に管理する。
 */
class SubscriberManager {
  private static instance: SubscriberManager;
  private current: Subscriber | null = null;

  private constructor() {}

  static getInstance(): SubscriberManager {
    if (!SubscriberManager.instance) {
      SubscriberManager.instance = new SubscriberManager();
    }
    return SubscriberManager.instance;
  }

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

/** 購読者管理シングルトンのインスタンス */
export const subscriberManager = SubscriberManager.getInstance();

/** Signal インターフェース */
export interface Signal<T> {
  /** 値を読み取る */
  (): T;
  /** 値を設定する */
  set(value: T): void;
  /** 関数で値を更新する */
  update(fn: (prev: T) => T): void;
  /** 現在の値を取得（購読なし） */
  peek(): T;
}

/**
 * Signal を作成する
 *
 * @param initialValue - 初期値
 * @returns Signal オブジェクト
 *
 * @example
 * ```typescript
 * const count = signal(0);
 *
 * // 読み取り
 * console.log(count());  // 0
 *
 * // 書き込み
 * count.set(5);
 * count.update(n => n * 2);  // 10
 *
 * // 購読なしで読み取り
 * console.log(count.peek());  // 10
 * ```
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Subscriber>();

  const read = (() => {
    // 現在の購読者がいれば登録
    const subscriber = subscriberManager.get();
    if (subscriber) {
      subscribers.add(subscriber);
    }
    return value;
  }) as Signal<T>;

  read.set = (newValue: T) => {
    if (!Object.is(value, newValue)) {
      value = newValue;
      // 全ての購読者に通知
      for (const sub of subscribers) {
        sub();
      }
    }
  };

  read.update = (fn: (prev: T) => T) => {
    read.set(fn(value));
  };

  read.peek = () => value;

  return read;
}

/**
 * 購読者を設定して関数を実行する（内部用）
 *
 * @deprecated subscriberManager.runWith を直接使用してください
 */
export function runWithSubscriber<T>(subscriber: Subscriber, fn: () => T): T {
  return subscriberManager.runWith(subscriber, fn);
}

/**
 * 現在の購読者を取得する（内部用）
 *
 * @deprecated subscriberManager.get を直接使用してください
 */
export function getCurrentSubscriber(): Subscriber | null {
  return subscriberManager.get();
}
