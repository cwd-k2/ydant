/**
 * Reactive パッケージの型定義
 */

/** Signal/Effect の購読者（変更通知を受け取るコールバック） */
export type Subscriber = () => void;

/**
 * 読み取り可能なリアクティブ値の共通インターフェース
 *
 * Signal, Computed など、値の読み取りと peek をサポートする型の基底インターフェース。
 */
export interface Readable<T> {
  /** 値を読み取る（依存関係を追跡） */
  (): T;
  /** 現在の値を取得（購読なし、依存関係を追跡しない） */
  peek(): T;
}
