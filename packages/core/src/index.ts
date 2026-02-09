/**
 * @ydant/core
 *
 * 純粋な DSL 処理系とプラグインシステム
 */

// =============================================================================
// Types (DSL 非依存の基盤型のみ)
// =============================================================================

export type {
  CleanupFn,
  Tagged,
  Extension,
  DSL,
  Child,
  ChildOfType,
  ChildNext,
  ChildReturn,
  Builder,
  Instructor,
  Instruction,
  Primitive,
  ChildContent,
  Render,
  Component,
} from "./types";

// =============================================================================
// Plugin System
// =============================================================================

export type { Plugin, PluginAPI, PluginResult, MountOptions } from "./plugin";

// =============================================================================
// Utilities
// =============================================================================

export { isTagged, toChildren } from "./utils";

// =============================================================================
// Mount
// =============================================================================

export { mount } from "./mount";

// =============================================================================
// Render (internal, for plugin implementations)
// =============================================================================

export { render, processIterator, createRenderContext, createPluginAPIFactory } from "./render";
export type { RenderContext, RenderContextCore, RenderContextExtension } from "./render";
