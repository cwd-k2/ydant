# @ydant/core

Rendering engine and plugin system for Ydant.

## Philosophy

**@ydant/core is a pure engine that doesn't know "what" to render.**

Core provides only:

- Generator processing
- Plugin dispatch
- Context management

It doesn't assume DOM existence. All concrete operations (DOM manipulation, lifecycle, keyed elements) are delegated to plugins. This separation keeps core's API surface minimal and stable, allowing plugins to extend functionality without modifying core.

For user-facing APIs like element factories and primitives, see `@ydant/base`.

## Installation

```bash
pnpm add @ydant/core
```

## Usage

```typescript
import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin, div, text, type Component } from "@ydant/base";

const App: Component = () => div(() => [text("Hello!")]);

scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()]).mount(App);
```

## API

### scope (Builder API)

```typescript
function scope<C extends string>(backend: Backend<C>, plugins: Plugin[]): ScopeBuilder<C>;

interface ScopeBuilder<C extends string = string> {
  mount(app: () => Render, options?: { scheduler?: Scheduler }): MountHandle;
  embed(content: Builder, options?: { scheduler?: Scheduler }): Spell<"embed">;
}

interface MountHandle {
  readonly hub: Hub;
  dispose(): void;
}
```

`scope()` creates a builder that bundles a backend and plugins. Terminal operations:

- `.mount(app)` — Mounts a component, returning a handle for disposal.
- `.embed(content)` — Use with `yield*` inside a component to embed content under this scope. Returns the `Engine` for the target scope.

The embed plugin is automatically registered; users don't need to manage it.

### Backend

```typescript
interface Backend<Capabilities extends string = string> {
  readonly __capabilities?: Capabilities; // phantom — compile-time only
  readonly name: string;
  readonly root: unknown;
  initContext(ctx: RenderContext): void;
  beforeRender?(ctx: RenderContext): void;
}
```

Backends define _where_ rendering happens (DOM, Canvas, SSR). They provide platform-specific capabilities (`tree`, `decorate`, `interact`, `schedule`) via `initContext`. See `@ydant/base` for `createDOMBackend`, `@ydant/canvas` for `createCanvasBackend`, `@ydant/ssr` for `createSSRBackend`.

### Plugin System

```typescript
interface Plugin {
  readonly name: string;
  readonly types: readonly string[];
  /** Plugin names that must be registered before this plugin */
  readonly dependencies?: readonly string[];
  /** Called once after mount rendering completes */
  setup?(ctx: RenderContext): void;
  /** Called when MountHandle.dispose() is invoked (reverse order) */
  teardown?(ctx: RenderContext): void;
  /** Initialize plugin-specific properties in RenderContext */
  initContext?(ctx: RenderContext, parentCtx?: RenderContext): void;
  /** Merge child context state into parent context (called after processChildren) */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /** Process a request and return a response for the generator */
  process(request: Request, ctx: RenderContext): Response;
}
```

### Types

| Type            | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `MountHandle`   | Handle returned by `scope().mount()` with `dispose()` for cleanup |
| `Tagged<T,P>`   | Helper type for tagged unions: `{ type: T } & P`                  |
| `SpellSchema`   | Co-locates request and response types per spell operation         |
| `Spell<Key>`    | Typed generator for a specific spell operation key                |
| `Request`       | Union of all yieldable types (derived from `SpellSchema`)         |
| `Response`      | Union of all response types returned by `process()`               |
| `Render`        | Generator for rendering — components, elements, and children      |
| `Builder`       | `() => Render \| Render[]` - Element children factory             |
| `Component<P?>` | `() => Render` (no args) or `(props: P) => Render` (with props)   |

### Plugin Extension Interfaces

Plugins can extend these interfaces via module augmentation:

```typescript
declare module "@ydant/core" {
  // Extend RenderContext with custom properties
  interface RenderContext {
    myProperty: MyType;
  }

  // Co-locate request, response, and return types per spell operation
  interface SpellSchema {
    mytype: { request: Tagged<"mytype", { value: string }>; response: MyResultType };
    // return omitted → falls back to response (MyResultType)
    // Use explicit `return` when it differs from response:
    // "other": { request: OtherType; response: Bar; return: Baz };
    // Or for return-only entries (no request):
    // "composite": { return: CompositeHandle };
  }
}

// Use Spell<Key> for typed generators
function* myOperation(): Spell<"mytype"> {
  const result = yield myRequest; // result is MyResultType
  return result;
}
```

### RenderContext

The rendering context holds state and methods during rendering. Core fields include `parent`, `plugins`, `processChildren`, and `createChildContext`. Capability providers inject backend-specific operations (`tree`, `decorate`, `interact`, `schedule`, `currentElement`) via the same module augmentation mechanism used by other plugins.

```typescript
interface RenderContext {
  parent: unknown;
  plugins: Map<string, Plugin>;
  allPlugins: readonly Plugin[];
  processChildren(builder: Builder, options?: { parent?: unknown }): void;
  createChildContext(parent: unknown): RenderContext;
}
```

### Utilities

| Function               | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `isTagged(value, tag)` | Type guard for tagged union types                 |
| `toRender(result)`     | Normalize `Render \| Render[]` to single `Render` |

## Creating Plugins

```typescript
import type { Request, Response, Plugin, RenderContext } from "@ydant/core";

// 1. Declare type extensions
declare module "@ydant/core" {
  interface RenderContext {
    myData: Map<string, unknown>;
  }
}

// 2. Create the plugin
export function createMyPlugin(): Plugin {
  return {
    name: "my-plugin",
    types: ["mytype"],
    dependencies: ["base"], // Ensure base plugin is registered first

    // Initialize context properties
    initContext(ctx, parentCtx) {
      ctx.myData = parentCtx?.myData ? new Map(parentCtx.myData) : new Map();
    },

    // Merge child context state into parent context
    mergeChildContext(parentCtx, childCtx) {
      for (const [key, value] of childCtx.myData) {
        parentCtx.myData.set(key, value);
      }
    },

    // Process requests — access ctx properties directly
    process(request: Request, ctx: RenderContext): Response {
      if ((request as { type: string }).type === "mytype") {
        // Access context properties directly: ctx.myData.get(key), ctx.myData.set(key, value)
        return result;
      }
    },
  };
}
```
