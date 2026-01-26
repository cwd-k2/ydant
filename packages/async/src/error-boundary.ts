/**
 * ErrorBoundary
 *
 * 子コンポーネントのエラーをキャッチしてフォールバック UI を表示する。
 *
 * @example
 * ```typescript
 * yield* ErrorBoundary({
 *   fallback: (error, reset) => div(function* () {
 *     yield* h2(() => [text("Something went wrong")]);
 *     yield* p(() => [text(error.message)]);
 *     yield* button(() => [on("click", reset), text("Try again")]);
 *   }),
 *   children: function* () {
 *     yield* RiskyComponent();
 *   },
 * });
 * ```
 */

import type { Child } from "@ydant/core";
import type { Render, Slot } from "@ydant/base";
import { div } from "@ydant/base";

/** children の型（戻り値は不要） */
type ChildGenerator = Generator<Child, unknown, Slot>;

/** ErrorBoundary コンポーネントの props */
export interface ErrorBoundaryProps {
  /** エラー発生時に表示するコンポーネント */
  fallback: (error: Error, reset: () => void) => Render;
  /** 子コンポーネント */
  children: () => ChildGenerator;
}

/**
 * ErrorBoundary コンポーネント
 *
 * 注意: JavaScript のジェネレータでは、yield で throw されたエラーを
 * キャッチするには特別な対応が必要です。
 * この実装は同期エラーのみをキャッチします。
 */
export function* ErrorBoundary(props: ErrorBoundaryProps): Render {
  const { fallback, children } = props;

  const containerSlot = yield* div(function* () {
    try {
      yield* children();
    } catch (error) {
      // Promise（Suspense）は再 throw
      if (error instanceof Promise) {
        throw error;
      }

      // エラーをキャッチしてフォールバックを表示
      const reset = () => {
        containerSlot.refresh(function* () {
          try {
            yield* children();
          } catch (retryError) {
            if (retryError instanceof Promise) {
              throw retryError;
            }
            yield* fallback(retryError as Error, reset);
          }
        });
      };

      yield* fallback(error as Error, reset);
    }
  });

  return containerSlot;
}
