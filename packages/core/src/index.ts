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
  DSLSchema,
  DSL,
  Child,
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

export type { Plugin, RenderAPI, ProcessResult, MountOptions } from "./plugin";

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

export { render, processIterator, createRenderContext, createRenderAPIFactory } from "./render";
export type { RenderContext } from "./render";
