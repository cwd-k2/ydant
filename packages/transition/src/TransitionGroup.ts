/**
 * TransitionGroup コンポーネント
 *
 * リスト要素の追加/削除時に CSS トランジションを適用する。
 * keyed() を使って要素を追跡し、追加・削除・移動を検出する。
 *
 * @example
 * ```typescript
 * yield* TransitionGroup({
 *   items: todoList,
 *   keyFn: (item) => item.id,
 *   enter: "transition-opacity duration-300",
 *   enterFrom: "opacity-0",
 *   enterTo: "opacity-100",
 *   leave: "transition-opacity duration-300",
 *   leaveFrom: "opacity-100",
 *   leaveTo: "opacity-0",
 *   children: (item) => div(() => [text(item.name)]),
 * });
 * ```
 */

import type { Slot, ElementRender } from "@ydant/base";
import { div, keyed, onMount } from "@ydant/base";
import { addClasses, removeClasses, waitForTransition } from "./utils";

export interface TransitionGroupProps<T> {
  /** トランジション対象のアイテム配列 */
  items: T[];
  /** 各アイテムのユニークキーを返す関数 */
  keyFn: (item: T) => string | number;
  /** 入場トランジションの基本クラス */
  enter?: string;
  /** 入場開始時のクラス */
  enterFrom?: string;
  /** 入場終了時のクラス */
  enterTo?: string;
  /** 退場トランジションの基本クラス */
  leave?: string;
  /** 退場開始時のクラス */
  leaveFrom?: string;
  /** 退場終了時のクラス */
  leaveTo?: string;
  /** 各アイテムをレンダリングする関数（要素を返す必要がある） */
  children: (item: T, index: number) => ElementRender;
}

/**
 * 入場トランジションを実行
 */
async function enterTransition<T>(el: HTMLElement, props: TransitionGroupProps<T>): Promise<void> {
  // 初期状態を設定
  addClasses(el, props.enter);
  addClasses(el, props.enterFrom);

  // 強制リフロー
  void el.offsetHeight;

  // 次のフレームでトランジションを開始
  requestAnimationFrame(() => {
    removeClasses(el, props.enterFrom);
    addClasses(el, props.enterTo);
  });

  // トランジション終了を待つ
  await waitForTransition(el);

  // クリーンアップ
  removeClasses(el, props.enter);
  removeClasses(el, props.enterTo);
}

/**
 * 退場トランジションを実行し、完了後に要素を削除
 */
async function leaveTransition<T>(
  el: HTMLElement,
  props: Omit<TransitionGroupProps<T>, "items">,
): Promise<void> {
  // leave が設定されていない場合は即座に削除
  if (!props.leave && !props.leaveFrom && !props.leaveTo) {
    el.remove();
    return;
  }

  // 初期状態を設定
  addClasses(el, props.leave);
  addClasses(el, props.leaveFrom);

  // 強制リフロー
  void el.offsetHeight;

  // 次のフレームでトランジションを開始
  requestAnimationFrame(() => {
    removeClasses(el, props.leaveFrom);
    addClasses(el, props.leaveTo);
  });

  // トランジション終了を待つ
  await waitForTransition(el);

  // 要素を削除
  el.remove();
}

/**
 * TransitionGroup コンポーネント
 *
 * keyed() と Slot.refresh() を組み合わせて、
 * リスト要素の追加・削除時にトランジションを適用する。
 */
export function* TransitionGroup<T>(props: TransitionGroupProps<T>): ElementRender {
  const { items, keyFn, children } = props;

  // 現在のキーセットを追跡
  const currentKeys = new Set<string | number>();
  for (const item of items) {
    currentKeys.add(keyFn(item));
  }

  // コンテナ要素を作成
  const containerSlot = yield* div(function* () {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemKey = keyFn(item);

      // keyed() で要素をラップし、キーを付与
      const itemSlot = yield* keyed(
        itemKey,
        div,
      )(function* () {
        yield* children(item, i);
      });

      // 入場トランジションを適用
      yield* onMount(() => {
        enterTransition(itemSlot.node, props);
      });
    }
  });

  return containerSlot;
}

/** Stateful refresher の内部状態 */
interface RefresherState<T> {
  /** 前回の items */
  prevItems: T[];
  /** key -> HTMLElement のマップ */
  elementsByKey: Map<string | number, HTMLElement>;
}

/**
 * TransitionGroup のリフレッシュ用ヘルパー（stateful）
 *
 * Slot.refresh() と組み合わせて使用する。
 * 新しいアイテムリストを受け取り、トランジション付きで更新する。
 *
 * 削除されるアイテムには leave トランジションが適用され、
 * トランジション完了後に DOM から削除される。
 */
export function createTransitionGroupRefresher<T>(
  props: Omit<TransitionGroupProps<T>, "items">,
): (slot: Slot, items: T[]) => void {
  const { keyFn, children } = props;

  // 状態を保持
  const state: RefresherState<T> = {
    prevItems: [],
    elementsByKey: new Map(),
  };

  return (slot: Slot, items: T[]) => {
    const newKeys = new Set<string | number>();
    for (const item of items) {
      newKeys.add(keyFn(item));
    }

    // 削除されるアイテムを検出し、leave トランジションを開始
    const prevKeys = new Set(state.prevItems.map(keyFn));
    for (const prevKey of prevKeys) {
      if (!newKeys.has(prevKey)) {
        const el = state.elementsByKey.get(prevKey);
        if (el) {
          // leave トランジションを開始（非同期で削除される）
          leaveTransition(el, props);
          state.elementsByKey.delete(prevKey);
        }
      }
    }

    // 新しいアイテムで refresh
    slot.refresh(function* () {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemKey = keyFn(item);
        const isNew = !prevKeys.has(itemKey);

        // keyed() で要素をラップし、キーを付与
        const itemSlot = yield* keyed(
          itemKey,
          div,
        )(function* () {
          yield* children(item, i);
        });

        // 要素を記録
        state.elementsByKey.set(itemKey, itemSlot.node);

        // 新しい要素のみ入場トランジションを適用
        if (isNew) {
          yield* onMount(() => {
            enterTransition(itemSlot.node, props as TransitionGroupProps<T>);
          });
        }
      }
    });

    // 状態を更新
    state.prevItems = [...items];
  };
}
