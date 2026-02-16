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

export type { Plugin, RenderContext } from "./plugin";

// =============================================================================
// Utilities
// =============================================================================

export { isTagged, toRender } from "./utils";

// =============================================================================
// Mount
// =============================================================================

export type { MountOptions, MountHandle } from "./mount";
export { mount } from "./mount";
