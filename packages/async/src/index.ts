/// <reference path="./global.d.ts" />
/**
 * @ydant/async
 *
 * 非同期コンポーネント（Suspense, ErrorBoundary, Resource）とエラー境界プラグイン
 */

// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

// ─── Types ───
export type { Resource } from "./resource";
export type { SuspenseProps } from "./Suspense";
export type { ErrorBoundaryProps } from "./ErrorBoundary";
// ─── Runtime ───
export { createResource } from "./resource";
export { Suspense } from "./Suspense";
export { ErrorBoundary } from "./ErrorBoundary";
export { createAsyncPlugin } from "./plugin";
