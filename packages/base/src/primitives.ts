/**
 * @ydant/base - プリミティブ
 */

import type { Builder, CleanupFn, Primitive, Render } from "@ydant/core";
import type { Attribute, Listener, Text, Lifecycle, ElementRender, Slot } from "./types";

/** プリミティブを yield するジェネレーター関数を作成するファクトリ */
function createPrimitive<T extends Attribute | Listener | Text | Lifecycle, Args extends unknown[]>(
  factory: (...args: Args) => T,
) {
  return function* (...args: Args): Primitive<T> {
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
export function classes(...classNames: (string | string[])[]): Primitive<Attribute> {
  return (function* () {
    const value = classNames.flat().join(" ");
    yield { type: "attribute" as const, key: "class", value };
  })();
}

/** イベントリスナを yield（HTMLElementEventMap のイベント型を推論） */
export function on<K extends keyof HTMLElementEventMap>(
  key: K,
  handler: (e: HTMLElementEventMap[K]) => void,
): Primitive<Listener>;
/** イベントリスナを yield（カスタムイベント用フォールバック） */
export function on(key: string, handler: (e: Event) => void): Primitive<Listener>;
export function on(key: string, handler: (e: Event) => void): Primitive<Listener> {
  return (function* () {
    yield { type: "listener" as const, key, value: handler };
  })();
}

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
export function* onMount(callback: () => void | CleanupFn): Primitive<Lifecycle> {
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
export function* onUnmount(callback: () => void): Primitive<Lifecycle> {
  yield { type: "lifecycle", event: "unmount", callback };
}

/**
 * インラインスタイルを設定する
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
): Primitive<Attribute> {
  const styleValue = Object.entries(properties as Record<string, string>)
    .map(([k, v]) => {
      // camelCase を kebab-case に変換（CSS 変数は除く）
      const prop = k.startsWith("--") ? k : k.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${prop}: ${v}`;
    })
    .join("; ");
  yield { type: "attribute", key: "style", value: styleValue };
}

/**
 * 要素ファクトリやコンポーネントをラップし、生成される Element に key を付与する
 *
 * @param key - 一意な識別子（string または number）
 * @param factory - 要素ファクトリ（div, li 等）またはコンポーネント
 * @returns key 付きファクトリ（元と同じ引数を受け取る）
 *
 * @example
 * ```typescript
 * // 要素ファクトリと組み合わせ
 * yield* keyed(item.id, li)(() => [text(item.name)]);
 *
 * // コンポーネントと組み合わせ
 * yield* keyed(item.id, ListItemView)({ item, onDelete });
 * ```
 */
export function keyed<Args extends unknown[]>(
  key: string | number,
  factory: (...args: Args) => Render,
): (...args: Args) => ElementRender {
  return (...args: Args) => {
    return (function* (): ElementRender {
      const inner = factory(...args) as ElementRender;
      const first = inner.next();
      if (first.done) return first.value;
      const element = first.value;
      const slot = (yield { ...element, key }) as Slot;
      inner.next(slot);
      return slot;
    })() as ElementRender;
  };
}
