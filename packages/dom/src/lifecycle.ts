/**
 * ライフサイクル管理
 */

import type { RenderContext } from "./types";

/**
 * マウントコールバックを実行
 *
 * DOM 更新完了後（requestAnimationFrame のタイミング）に実行し、
 * クリーンアップ関数が返された場合は unmountCallbacks に追加する
 */
export function executeMount(ctx: RenderContext): void {
  requestAnimationFrame(() => {
    for (const callback of ctx.mountCallbacks) {
      const cleanup = callback();
      if (typeof cleanup === "function") {
        ctx.unmountCallbacks.push(cleanup);
      }
    }
    ctx.mountCallbacks = [];
  });
}

/**
 * アンマウントコールバックを実行
 */
export function executeUnmount(ctx: RenderContext): void {
  for (const callback of ctx.unmountCallbacks) {
    callback();
  }
  ctx.unmountCallbacks = [];
}
