/**
 * DOM Renderer Plugin System
 *
 * プラグインの型を @ydant/core から再エクスポート。
 * 後方互換性のため維持。
 */

// Re-export plugin types from core
export type { PluginAPI, PluginResult, DomPlugin } from "@ydant/core";

/**
 * mount のオプション
 */
export interface MountOptions {
  /** 使用するプラグインの配列 */
  plugins?: import("@ydant/core").DomPlugin[];
}
