import type { Attribute, Listener, Text, Lifecycle, Style, Key } from "./types";

/** プリミティブを yield するジェネレーター関数を作成するファクトリ */
function createPrimitive<T, Args extends unknown[]>(factory: (...args: Args) => T) {
  return function* (...args: Args): Generator<T, void, void> {
    yield factory(...args);
  };
}

/** HTML 属性を yield */
export const attr = createPrimitive(
  (key: string, value: string): Attribute => ({
    type: "attribute",
    key,
    value,
  }),
);

/** class 属性のショートハンド */
export const clss = createPrimitive(
  (classes: string[]): Attribute => ({
    type: "attribute",
    key: "class",
    value: classes.join(" "),
  }),
);

/** イベントリスナを yield */
export const on = createPrimitive(
  (key: string, handler: (e: Event) => void): Listener => ({
    type: "listener",
    key,
    value: handler,
  }),
);

/** テキストノードを yield */
export const text = createPrimitive((content: string): Text => ({ type: "text", content }));

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
export function* onMount(callback: () => void | (() => void)): Generator<Lifecycle, void, void> {
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

/**
 * インラインスタイルを設定する（型安全）
 *
 * @param properties - CSS プロパティのオブジェクト
 *
 * @example
 * ```typescript
 * yield* style({
 *   padding: "16px",
 *   display: "flex",
 *   "--primary-color": "#3b82f6",
 * });
 * ```
 */
export function* style(
  properties: Partial<CSSStyleDeclaration> & Record<`--${string}`, string>,
): Generator<Style, void, void> {
  yield { type: "style", properties: properties as Record<string, string> };
}

/**
 * リスト要素の一意な識別子を設定する（差分更新用マーカー）
 *
 * @param value - 一意な識別子（string または number）
 *
 * @example
 * ```typescript
 * for (const item of items) {
 *   yield* li(() => [
 *     key(item.id),
 *     text(item.name),
 *   ]);
 * }
 * ```
 */
export function* key(value: string | number): Generator<Key, void, void> {
  yield { type: "key", value };
}
