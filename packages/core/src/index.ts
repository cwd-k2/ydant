/// <reference path="./global.d.ts" />
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
  SpellSchema,
  Spell,
  Request,
  Response,
  Builder,
  MaybeRender,
  Render,
  Component,
  RequiredCapabilities,
  ProvidedCapabilities,
  CapabilityCheck,
} from "./types";

// =============================================================================
// Capabilities
// =============================================================================

export type {
  TreeCapability,
  DecorateCapability,
  InteractCapability,
  ScheduleCapability,
  ResolveCapability,
} from "./capabilities";

// =============================================================================
// Plugin System
// =============================================================================

export type { Backend, Plugin, RenderContext, Scheduler, Engine, Hub } from "./plugin";

// =============================================================================
// Utilities
// =============================================================================

export { isTagged } from "./utils";

// =============================================================================
// Scheduler
// =============================================================================

export { sync, microtask, animFrame } from "./scheduler";

// =============================================================================
// Scope Builder
// =============================================================================

export type { ScopeBuilder } from "./scope";
export { scope } from "./scope";

// =============================================================================
// Mount (types only — use mount() from @ydant/base or scope().mount())
// =============================================================================

export type { ExecutionScopeOptions, MountHandle } from "./mount";
