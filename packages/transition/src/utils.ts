/**
 * Transition ユーティリティ関数
 *
 * Transition, TransitionGroup コンポーネントで共通使用される
 * CSS クラス操作とトランジション待機のヘルパー関数。
 */

/**
 * 要素に CSS クラスを追加する
 *
 * スペース区切りのクラス文字列を分割して追加する。
 * 空文字列や undefined は無視される。
 *
 * @param el - 対象の HTML 要素
 * @param classes - スペース区切りのクラス文字列
 */
export function addClasses(el: HTMLElement, classes: string | undefined): void {
  if (classes) {
    el.classList.add(...classes.split(" ").filter(Boolean));
  }
}

/**
 * 要素から CSS クラスを削除する
 *
 * スペース区切りのクラス文字列を分割して削除する。
 * 空文字列や undefined は無視される。
 *
 * @param el - 対象の HTML 要素
 * @param classes - スペース区切りのクラス文字列
 */
export function removeClasses(el: HTMLElement, classes: string | undefined): void {
  if (classes) {
    el.classList.remove(...classes.split(" ").filter(Boolean));
  }
}

/**
 * CSS トランジションの終了を待機する
 *
 * 要素の transitionDuration を取得し、transitionend イベントを待つ。
 * duration が 0 の場合は即座に resolve する。
 * 安全のため、duration + 50ms でタイムアウトを設定する。
 *
 * @param el - 対象の HTML 要素
 * @returns トランジション終了時に resolve する Promise
 */
export function waitForTransition(el: HTMLElement): Promise<void> {
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
