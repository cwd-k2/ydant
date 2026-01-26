/**
 * @ydant/core
 *
 * 純粋な DSL 処理系とプラグインシステム
 */

// =============================================================================
// Types (DSL 非依存の基盤型のみ)
// =============================================================================

export type {
  Tagged,
  Child,
  ChildNext,
  ChildReturn,
  Builder,
  Instructor,
  Instruction,
  Render,
  Component,
  // Plugin extension points
  PluginChildExtensions,
  PluginNextExtensions,
  PluginReturnExtensions,
} from "./types";

// =============================================================================
// Plugin System
// =============================================================================

export type { Plugin, PluginAPI, PluginAPIExtensions, PluginResult, MountOptions } from "./plugin";

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
export type { RenderContext, RenderContextCore, RenderContextExtensions } from "./render";
