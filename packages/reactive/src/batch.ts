/**
 * バッチ更新: 複数の Signal 更新を一度にまとめて通知する
 *
 * NOTE: batchDepth と pendingEffects はモジュールレベルのグローバル状態。
 * テスト間での分離には __resetForTesting__() を使用。
 *
 * @example
 * ```typescript
 * const firstName = signal("John");
 * const lastName = signal("Doe");
 *
 * effect(() => {
 *   console.log(`${firstName()} ${lastName()}`);
 * });
 * // 出力: "John Doe"
 *
 * batch(() => {
 *   firstName.set("Jane");
 *   lastName.set("Smith");
 * });
 * // 出力: "Jane Smith" (1回だけ)
 * ```
 */

let batchDepth = 0;
let pendingEffects = new Set<() => void>();

/**
 * テスト用: 状態をリセット
 * @internal
 */
export function __resetForTesting__(): void {
  batchDepth = 0;
  pendingEffects = new Set();
}

/**
 * バッチ更新を実行する
 *
 * バッチ内で行われた複数の Signal 更新は、バッチ終了時に
 * まとめて1回だけ effect を実行する。
 *
 * @param fn - バッチ内で実行する関数
 */
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const effects = pendingEffects;
      pendingEffects = new Set();
      for (const effect of effects) {
        effect();
      }
    }
  }
}

/**
 * 内部用: バッチ中かどうかを確認し、effect を遅延実行キューに追加
 *
 * @returns バッチ中で遅延された場合は true
 */
export function scheduleEffect(effect: () => void): boolean {
  if (batchDepth > 0) {
    pendingEffects.add(effect);
    return true;
  }
  return false;
}
