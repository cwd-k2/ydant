/**
 * @ydant/ssr - Node resolver
 *
 * Hydration 用の「ノード取得能力」レイヤー。
 * 既存 DOM ツリーをカーソルで歩き、createElement の代わりに
 * 既存の子ノードを順番に返す。
 *
 * Target でも Plugin でもない、独立した能力の提供者。
 * Plugin が「DSL をどう読むか」を決め、その中で必要に応じて
 * このレイヤーの能力を使う。
 */

/** Cursor-based resolver that walks existing child nodes of a parent. */
export interface NodeResolver {
  /** Returns the next child node of `parent`, advancing the cursor. */
  nextChild(parent: unknown): unknown | null;
}

/**
 * Creates a {@link NodeResolver} backed by the browser DOM.
 *
 * Each parent node has its own cursor position (tracked via WeakMap).
 * Successive calls to `nextChild(parent)` return `childNodes[0]`,
 * `childNodes[1]`, etc.
 */
export function createDOMNodeResolver(): NodeResolver {
  const cursors = new WeakMap<object, number>();

  return {
    nextChild(parent: unknown): unknown | null {
      const node = parent as Node;
      const index = cursors.get(node) ?? 0;
      cursors.set(node, index + 1);
      return node.childNodes[index] ?? null;
    },
  };
}
