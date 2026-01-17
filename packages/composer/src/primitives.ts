import type { Attribute, EventListener, Text } from "@ydant/interface";

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
  (key: string, handler: (e: Event) => void): EventListener => ({
    type: "eventlistener",
    key,
    value: handler,
  })
);

/** テキストノードを yield */
export const text = createPrimitive(
  (content: string): Text => ({ type: "text", content })
);
