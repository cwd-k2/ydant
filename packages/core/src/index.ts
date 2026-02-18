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

export type {
  Backend,
  ExecutionScope,
  Plugin,
  RenderContext,
  Scheduler,
  Message,
  EngineOptions,
  Engine,
  Hub,
} from "./plugin";

// =============================================================================
// Utilities
// =============================================================================

export { isTagged, toRender } from "./utils";

// =============================================================================
// Embed (type only — createEmbedPlugin is auto-registered by scope())
// =============================================================================

export type { Embed } from "./embed";

// =============================================================================
// Scheduler
// =============================================================================

export { sync, microtask, animFrame } from "./scheduler";

// =============================================================================
// Hub
// =============================================================================

export { createHub } from "./hub";

// =============================================================================
// Scope Builder
// =============================================================================

export type { ScopeBuilder } from "./scope";
export { scope } from "./scope";

// =============================================================================
// Mount (types only — use scope().mount() instead)
// =============================================================================

export type { MountHandle } from "./mount";
