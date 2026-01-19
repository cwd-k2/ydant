import type { Attribute, Listener, Tap, Text, Lifecycle } from "./types";

/** プリミティブを yield するジェネレーター関数を作成するファクトリ */
function createPrimitive<T, Args extends unknown[]>(
  factory: (...args: Args) => T
) {
  return function* (...args: Args): Generator<T, void, void> {
    yield factory(...args);
  };
}

/** HTML 属性を yield */
export const attr = createPrimitive(
  (key: string, value: string): Attribute => ({ type: "attribute", key, value })
);

/** class 属性のショートハンド */
export const clss = createPrimitive(
  (classes: string[]): Attribute => ({
    type: "attribute",
    key: "class",
    value: classes.join(" "),
  })
);

/** イベントリスナを yield */
export const on = createPrimitive(
  (key: string, handler: (e: Event) => void): Listener => ({
    type: "listener",
    key,
    value: handler,
  })
);

/** テキストノードを yield */
export const text = createPrimitive(
  (content: string): Text => ({ type: "text", content })
);

/** DOM 要素に直接アクセスして操作 */
export function* tap<E extends HTMLElement = HTMLElement>(
  callback: (el: E) => void
): Generator<Tap, void, void> {
  yield { type: "tap", callback: callback as (el: HTMLElement) => void };
}

/**
 * コンポーネントがマウントされた時に実行されるコールバックを登録する
 *
 * @param callback - マウント時に実行される関数。クリーンアップ関数を返すことができる。
 *
 * @example
 * ```typescript
 * yield* onMount(() => {
 *   const interval = setInterval(() => console.log("tick"), 1000);
 *   return () => clearInterval(interval);  // クリーンアップ
 * });
 * ```
 */
export function* onMount(
  callback: () => void | (() => void)
): Generator<Lifecycle, void, void> {
  yield { type: "lifecycle", event: "mount", callback };
}

/**
 * コンポーネントがアンマウントされる時に実行されるコールバックを登録する
 *
 * @param callback - アンマウント時に実行される関数
 *
 * @example
 * ```typescript
 * yield* onUnmount(() => {
 *   console.log("Component unmounted");
 * });
 * ```
 */
export function* onUnmount(callback: () => void): Generator<Lifecycle, void, void> {
  yield { type: "lifecycle", event: "unmount", callback };
}
