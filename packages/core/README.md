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
import { mount } from "@ydant/core";
import { createBasePlugin, div, text, type Component } from "@ydant/base";

const App: Component = () => div(() => [text("Hello!")]);

mount(App, document.getElementById("app")!, {
  plugins: [createBasePlugin()],
});
```

## API

### Mount

```typescript
function mount(app: Component, parent: HTMLElement, options?: MountOptions): void;

interface MountOptions {
  plugins?: Plugin[];
}
```

### Plugin System

```typescript
interface Plugin {
  readonly name: string;
  readonly types: readonly string[];
  /** Plugin names that must be registered before this plugin */
  readonly dependencies?: readonly string[];
  /** Initialize plugin-specific properties in RenderContext */
  initContext?(
    ctx: RenderContextCore & Partial<RenderContextExtensions>,
    parentCtx?: RenderContext,
  ): void;
  /** Extend PluginAPI with plugin-specific methods */
  extendAPI?(api: Partial<PluginAPIExtensions>, ctx: RenderContext): void;
  /** Merge child context state into parent context (called after processChildren) */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /** Process a child element */
  process(child: Child, api: PluginAPI): PluginResult;
}

interface PluginResult {
  value?: ChildNext | undefined;
}
```

### Types

| Type             | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `Tagged<T,P>`    | Helper type for tagged unions: `{ type: T } & P`                      |
| `CleanupFn`      | `() => void` - Lifecycle cleanup function                             |
| `Child`          | Union of all yieldable types (extended by plugins)                    |
| `ChildOfType<T>` | Extract a specific type from `Child` by tag                           |
| `ChildNext`      | Union of values passed via `next()` (extended by plugins)             |
| `ChildReturn`    | Union of return values (extended by plugins)                          |
| `Builder`        | `() => Instructor \| Instruction[]` - Element factory argument        |
| `Instructor`     | `Iterator<Child, ChildReturn, ChildNext>` - Internal iterator         |
| `Instruction`    | `Generator<Child, ChildReturn, ChildNext>` - Primitive return type    |
| `Primitive<T>`   | `Generator<T, void, void>` - Side-effect-only primitive return type   |
| `ChildContent`   | `Generator<Child, unknown, ChildNext>` - Children builder return type |
| `Render`         | `Generator<Child, ChildReturn, ChildNext>` - Base rendering generator |
| `Component<P?>`  | `() => Render` (no args) or `(props: P) => Render` (with props)       |

### Plugin Extension Interfaces

Plugins can extend these interfaces via module augmentation:

```typescript
declare module "@ydant/core" {
  // Extend RenderContext with custom properties
  interface RenderContextExtensions {
    myProperty: MyType;
  }

  // Extend PluginAPI with custom methods
  interface PluginAPIExtensions {
    myMethod(): void;
  }

  // Extend Child types (yieldable values)
  interface PluginChildExtensions {
    MyType: Tagged<"mytype", { value: string }>;
  }

  // Extend values passed via next()
  interface PluginNextExtensions {
    MyResult: MyResultType;
  }

  // Extend return values
  interface PluginReturnExtensions {
    MyResult: MyResultType;
  }
}
```

### RenderContext

The rendering context holds state during rendering. Plugins extend it via `RenderContextExtensions`:

```typescript
interface RenderContextCore {
  parent: Node;
  currentElement: Element | null;
  plugins: Map<string, Plugin>;
}

type RenderContext = RenderContextCore & RenderContextExtensions;
```

### Utilities

| Function               | Description                            |
| ---------------------- | -------------------------------------- |
| `isTagged(value, tag)` | Type guard for tagged union types      |
| `toChildren(result)`   | Normalize array/iterator to Instructor |

## Creating Plugins

```typescript
import type { Plugin, PluginAPI, PluginResult, Child } from "@ydant/core";

// 1. Declare type extensions
declare module "@ydant/core" {
  interface RenderContextExtensions {
    myData: Map<string, unknown>;
  }
  interface PluginAPIExtensions {
    getMyData(key: string): unknown;
    setMyData(key: string, value: unknown): void;
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

    // Extend PluginAPI with methods
    extendAPI(api, ctx) {
      api.getMyData = (key: string) => ctx.myData.get(key);
      api.setMyData = (key: string, value: unknown) => ctx.myData.set(key, value);
    },

    // Process child elements
    process(child: Child, api: PluginAPI): PluginResult {
      if ((child as { type: string }).type === "mytype") {
        // Process the child using api.getMyData(), api.setMyData()
        return { value: result };
      }
      return {};
    },
  };
}
```
