import type { Child, Slot, Key, ElementGenerator } from "./types";

/** ヘルパー内でのジェネレーター委譲用の型（Slot | void を受け入れ可能） */
type DelegateGen = Generator<Child, Slot | void, Slot | void>;

/**
 * ElementGenerator を DelegateGen として扱えるようにするヘルパー
 * 実行時は同一のジェネレーターだが、型システム上の制約を回避する
 */
function asDelegateGen(gen: ElementGenerator): DelegateGen {
  return gen as unknown as DelegateGen;
}

/**
 * 条件に基づいてコンポーネントを表示する
 *
 * @param condition - 表示条件
 * @param whenTrue - 条件が真の時に表示するコンポーネント
 * @param whenFalse - 条件が偽の時に表示するコンポーネント（省略可能）
 *
 * @example
 * ```typescript
 * yield* show(isLoggedIn, () => UserProfile({ user }), () => LoginButton());
 * ```
 */
export function* show(
  condition: boolean,
  whenTrue: () => ElementGenerator,
  whenFalse?: () => ElementGenerator
): Generator<Child, void, Slot | void> {
  if (condition) {
    yield* asDelegateGen(whenTrue());
  } else if (whenFalse) {
    yield* asDelegateGen(whenFalse());
  }
}

interface EachOptions<T> {
  /** アイテムから一意なキーを取得する関数 */
  key: (item: T, index: number) => string | number;
  /** アイテムをレンダリングする関数 */
  render: (item: T, index: number) => ElementGenerator;
  /** アイテムが空の時に表示するコンポーネント */
  empty?: () => ElementGenerator;
}

/**
 * イテラブルの各要素をレンダリングする
 *
 * @param items - レンダリングするアイテムのイテラブル
 * @param options - レンダリングオプション
 *
 * @example
 * ```typescript
 * yield* each(todos, {
 *   key: (todo) => todo.id,
 *   render: (todo) => li(() => [text(todo.text)]),
 *   empty: () => p(() => [text("No items")]),
 * });
 * ```
 */
export function* each<T>(
  items: Iterable<T>,
  options: EachOptions<T>
): Generator<Child, void, Slot | void> {
  const arr = Array.from(items);

  if (arr.length === 0) {
    if (options.empty) {
      yield* asDelegateGen(options.empty());
    }
    return;
  }

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const keyValue = options.key(item, i);

    // key を yield してから要素を yield
    const keyObj: Key = { type: "key", value: keyValue };
    yield keyObj;
    yield* asDelegateGen(options.render(item, i));
  }
}
