/**
 * @ydant/core - Plugin system
 */

import type { Request, Response, Builder } from "./types";

// =============================================================================
// Scheduler
// =============================================================================

/** Decides *when* to flush an Engine's task queue. The flush callback is always synchronous. */
export type Scheduler = (flush: () => void) => void;

// =============================================================================
// Backend
// =============================================================================

/**
 * A rendering backend that provides platform-specific capabilities.
 *
 * Backends are conceptually distinct from plugins: a backend defines
 * *where* rendering happens (DOM, Canvas, SSR), while plugins define
 * *how* spell operations are processed.
 *
 * @example
 * ```typescript
 * import { scope } from "@ydant/core";
 * import { createDOMBackend, createBasePlugin } from "@ydant/base";
 *
 * scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()])
 *   .mount(App);
 * ```
 */
export interface Backend<Capabilities extends string = string> {
  /** Phantom field for compile-time capability tracking. Do not set at runtime. */
  readonly __capabilities?: Capabilities;
  /** Unique identifier for this backend. */
  readonly name: string;
  /** The root node to mount into. */
  readonly root: unknown;
  /** Default scheduler for engines using this backend. */
  readonly defaultScheduler?: Scheduler;
  /**
   * Initializes capability properties on a {@link RenderContext}.
   *
   * Called at mount time and whenever a child context is created,
   * before plugin initContext hooks.
   */
  initContext(ctx: RenderContext): void;
  /**
   * Called after context initialization but before the first iterator step.
   *
   * Use this to prepare the rendering root (e.g., clearing previous content).
   * Only called on the root context, not on child contexts.
   */
  beforeRender?(ctx: RenderContext): void;
}

// =============================================================================
// RenderContext
// =============================================================================

/**
 * Per-scope state carried through the rendering tree.
 *
 * Core fields are defined here; plugins add their own properties
 * via module augmentation (e.g., `@ydant/base` adds `keyedNodes`,
 * `@ydant/context` adds `contextValues`).
 *
 * Capability providers inject backend-specific operations (tree, decorate,
 * interact, schedule) via the same augmentation mechanism.
 *
 * @example
 * ```typescript
 * declare module "@ydant/core" {
 *   interface RenderContext {
 *     keyedNodes: Map<string | number, unknown>;
 *   }
 * }
 * ```
 */
export interface RenderContext {
  /** The node that children are appended to. */
  parent: unknown;
  /** The execution scope (backend + plugins) for this context. */
  scope: ExecutionScope;
  /** The engine managing this context's execution scope. */
  engine: Engine;
  /** Processes a {@link Builder}'s instructions in a new child context. */
  processChildren(builder: Builder, options?: { parent?: unknown; scope?: ExecutionScope }): void;
  /** Creates a new child-scoped {@link RenderContext} for the given parent node. */
  createChildContext(parent: unknown): RenderContext;
}

// =============================================================================
// ExecutionScope
// =============================================================================

/**
 * Bundles the three values that together define "which execution system
 * processes requests": a backend, a plugin dispatch map, and the ordered
 * plugin list for lifecycle hooks.
 *
 * Extracted so that `processChildren` can switch execution environments
 * (e.g., embedding a Canvas scope inside a DOM render).
 */
export interface ExecutionScope {
  /** The rendering backend that provides platform-specific capabilities. */
  readonly backend: Backend;
  /** Registered plugins keyed by their type tags (used for dispatch). */
  readonly pluginMap: ReadonlyMap<string, Plugin>;
  /** All registered plugins in registration order (used for lifecycle hooks). */
  readonly allPlugins: readonly Plugin[];
}

// =============================================================================
// Plugin
// =============================================================================

/** A plugin that teaches the core runtime how to handle specific spell operations. */
export interface Plugin {
  /** Unique identifier for this plugin. */
  readonly name: string;
  /** The `type` tags this plugin handles (e.g., `["element", "text"]`). */
  readonly types: readonly string[];
  /** Names of other plugins this one depends on. Checked at mount time. */
  readonly dependencies?: readonly string[];
  /**
   * Called once when the mount scope is created, before rendering begins.
   *
   * Use this to allocate resources or register event listeners that
   * live for the entire mount scope.
   */
  setup?(ctx: RenderContext): void;
  /**
   * Called when the mount scope is disposed, after rendering has stopped.
   *
   * Use this to release resources allocated in {@link setup}.
   * Teardown is called in reverse plugin registration order.
   */
  teardown?(ctx: RenderContext): void;
  /**
   * Initializes plugin-owned properties on a {@link RenderContext}.
   *
   * Called at mount time and whenever a child context is created.
   * Plugins should augment {@link RenderContext} and set their properties here.
   *
   * @param ctx - The context to initialize (core fields are already set).
   * @param parentCtx - The parent context, or `undefined` at the root.
   */
  initContext?(ctx: RenderContext, parentCtx?: RenderContext): void;
  /**
   * Propagates state from a child context back to its parent.
   *
   * Called after `processChildren` finishes iterating a child's requests.
   * Use this to merge cleanup callbacks, keyed nodes, or other accumulated state.
   *
   * @param parentCtx - The parent context.
   * @param childCtx - The child context that was just processed.
   */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /**
   * Processes a single {@link Request} and returns a response for the generator.
   *
   * Required when `types` is non-empty. Capability-only plugins (types: [])
   * may omit this.
   */
  process?(request: Request, ctx: RenderContext): Response;
}

// =============================================================================
// Engine / Hub
// =============================================================================

/** An inter-engine message. */
export interface Message {
  readonly type: string;
  readonly [key: string]: unknown;
}

/** Options for creating an {@link Engine}. */
export interface EngineOptions {
  scheduler?: Scheduler;
}

/**
 * An independent execution engine with a task queue and scheduler.
 *
 * Each Engine is associated with an {@link ExecutionScope} and uses
 * a {@link Scheduler} to decide when to flush its task queue.
 * Tasks are deduplicated via a Set — enqueueing the same function
 * reference multiple times results in a single execution.
 */
export interface Engine {
  /** Unique identifier for this engine. */
  readonly id: string;
  /** The execution scope this engine manages. */
  readonly scope: ExecutionScope;
  /** The hub that owns this engine. */
  readonly hub: Hub;
  /** Enqueues a task. Duplicate function references are deduplicated. */
  enqueue(task: () => void): void;
  /** Registers a callback invoked before each flush cycle begins. */
  onBeforeFlush(callback: () => void): void;
  /** Registers a callback invoked after each flush cycle completes. */
  onFlush(callback: () => void): void;
  /** Registers a handler for messages of the given type. */
  on(type: string, handler: (message: Message) => void): void;
  /** Stops the engine, preventing further task execution. */
  stop(): void;
}

/**
 * Orchestrates multiple {@link Engine} instances.
 *
 * The Hub manages engine lifecycle, scope-to-engine resolution,
 * and inter-engine message dispatch.
 */
export interface Hub {
  /** Creates a new engine with the given id and scope. */
  spawn(id: string, scope: ExecutionScope, options?: EngineOptions): Engine;
  /** Retrieves an engine by id. */
  get(id: string): Engine | undefined;
  /** Finds the engine associated with the given scope. */
  resolve(scope: ExecutionScope): Engine | undefined;
  /** Returns all active engines managed by this hub. */
  engines(): Iterable<Engine>;
  /** Dispatches a message to the engine identified by target. */
  dispatch(target: Engine | ExecutionScope, message: Message): void;
  /** Disposes all engines managed by this hub. */
  dispose(): void;
}
