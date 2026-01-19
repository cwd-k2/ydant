/**
 * Transition コンポーネント
 *
 * 要素の表示/非表示時に CSS トランジションを適用する。
 *
 * @example
 * ```typescript
 * yield* Transition({
 *   show: isVisible,
 *   enter: "transition-opacity duration-300",
 *   enterFrom: "opacity-0",
 *   enterTo: "opacity-100",
 *   leave: "transition-opacity duration-300",
 *   leaveFrom: "opacity-100",
 *   leaveTo: "opacity-0",
 *   children: () => div(() => [text("Content")]),
 * });
 * ```
 */

import type { ElementGenerator } from "@ydant/core";
import { div, onMount } from "@ydant/core";

export interface TransitionProps {
  /** 要素を表示するかどうか */
  show: boolean;
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
  /** トランジション対象の子要素 */
  children: () => ElementGenerator;
}

/**
 * CSS クラスを追加
 */
function addClasses(el: HTMLElement, classes: string | undefined): void {
  if (classes) {
    el.classList.add(...classes.split(" ").filter(Boolean));
  }
}

/**
 * CSS クラスを削除
 */
function removeClasses(el: HTMLElement, classes: string | undefined): void {
  if (classes) {
    el.classList.remove(...classes.split(" ").filter(Boolean));
  }
}

/**
 * トランジション終了を待つ
 */
function waitForTransition(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const computed = getComputedStyle(el);
    const duration = parseFloat(computed.transitionDuration) * 1000;

    if (duration === 0) {
      resolve();
      return;
    }

    const handler = () => {
      el.removeEventListener("transitionend", handler);
      resolve();
    };
    el.addEventListener("transitionend", handler);

    // タイムアウト（念のため）
    setTimeout(resolve, duration + 50);
  });
}

/**
 * 入場トランジションを実行
 */
async function enterTransition(
  el: HTMLElement,
  props: TransitionProps
): Promise<void> {
  // 初期状態を設定
  addClasses(el, props.enter);
  addClasses(el, props.enterFrom);

  // 強制リフロー
  el.offsetHeight;

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
 * 退場トランジションを実行
 */
async function leaveTransition(
  el: HTMLElement,
  props: TransitionProps
): Promise<void> {
  // 初期状態を設定
  addClasses(el, props.leave);
  addClasses(el, props.leaveFrom);

  // 強制リフロー
  el.offsetHeight;

  // 次のフレームでトランジションを開始
  requestAnimationFrame(() => {
    removeClasses(el, props.leaveFrom);
    addClasses(el, props.leaveTo);
  });

  // トランジション終了を待つ
  await waitForTransition(el);

  // クリーンアップ
  removeClasses(el, props.leave);
  removeClasses(el, props.leaveTo);
}

/**
 * Transition コンポーネント
 */
export function Transition(props: TransitionProps): ElementGenerator {
  const { show, children } = props;

  return div(function* () {
    // コンテナはスタイルなしの wrapper
    // 実際のトランジションは子要素に適用

    if (show) {
      const childSlot = yield* children();

      // 入場トランジションを実行
      yield* onMount(() => {
        enterTransition(childSlot.node, props);
      });
    }
  });
}

/**
 * 状態を持つ Transition（show の変化に対応）
 *
 * 注意: この実装は show の初期値に基づいて動作する。
 * show の変化に対応するには、親コンポーネントで Slot.refresh() を使用する。
 */
export function* TransitionWithState(
  props: TransitionProps
): ElementGenerator {
  // 現在の状態を保持するコンテナを作成
  const containerSlot = yield* div(function* () {
    if (props.show) {
      const childSlot = yield* props.children();

      yield* onMount(() => {
        enterTransition(childSlot.node, props);
      });
    }
  });

  return containerSlot;
}
