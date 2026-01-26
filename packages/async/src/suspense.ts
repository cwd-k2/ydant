/**
 * Suspense
 *
 * 非同期コンポーネントのローディング状態を管理する。
 * 子コンポーネントが Promise を throw した場合、fallback を表示する。
 *
 * @example
 * ```typescript
 * yield* Suspense({
 *   fallback: () => div(() => [text("Loading...")]),
 *   children: function* () {
 *     const data = dataResource();  // suspend if pending
 *     yield* div(() => [text(data.message)]);
 *   },
 * });
 * ```
 */

import type { Child, Render } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { div } from "@ydant/base";

/** children の型（戻り値は不要） */
type ChildGenerator = Generator<Child, unknown, Slot>;

/** Suspense コンポーネントの props */
export interface SuspenseProps {
  /** ローディング中に表示するコンポーネント */
  fallback: () => Render;
  /** 子コンポーネント */
  children: () => ChildGenerator;
}

/**
 * Suspense コンポーネント
 *
 * 注意: 現在の実装では、ジェネレータベースの DSL と
 * Promise throw パターンの組み合わせに制限があります。
 * 代替として、Resource の loading/error プロパティを使った
 * 明示的なローディング状態管理を推奨します。
 */
export function* Suspense(props: SuspenseProps): Render {
  const { fallback, children } = props;

  const containerSlot = yield* div(function* () {
    let isSuspended = false;
    let pendingPromise: Promise<unknown> | null = null;

    // 子コンポーネントを試行
    try {
      yield* children();
    } catch (thrown) {
      if (thrown instanceof Promise) {
        isSuspended = true;
        pendingPromise = thrown;
      } else {
        throw thrown;
      }
    }

    // サスペンド状態の場合は fallback を表示
    if (isSuspended && pendingPromise) {
      yield* fallback();

      // Promise が解決したら再レンダリング
      pendingPromise.then(() => {
        containerSlot.refresh(function* () {
          yield* children();
        });
      });
    }
  });

  return containerSlot;
}

/**
 * 明示的なローディング状態を使った代替パターン
 *
 * Resource の loading プロパティを使って条件分岐する。
 *
 * @example
 * ```typescript
 * import { createResource } from "@ydant/async";
 * import { show } from "@ydant/core";
 *
 * const dataResource = createResource(fetchData, { initialValue: null });
 *
 * yield* show(
 *   dataResource.loading,
 *   () => div(() => [text("Loading...")]),
 *   () => div(() => [text(dataResource()?.message ?? "")])
 * );
 * ```
 */
