/**
 * @ydant/async
 *
 * 非同期コンポーネント（Suspense, ErrorBoundary, Resource）
 */

// Import base types to ensure module augmentation is loaded
import "@ydant/base";

export { createResource } from "./resource";
export type { Resource } from "./resource";

export { Suspense } from "./suspense";
export type { SuspenseProps } from "./suspense";

export { ErrorBoundary } from "./error-boundary";
export type { ErrorBoundaryProps } from "./error-boundary";
