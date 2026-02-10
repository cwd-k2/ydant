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
  initContext?(ctx: RenderContext, parentCtx?: RenderContext): void;
  /** Merge child context state into parent context (called after processChildren) */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /** Process a request and return a response for the generator */
  process(request: Request, ctx: RenderContext): Response;
}
```

### Types

| Type            | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `Tagged<T,P>`   | Helper type for tagged unions: `{ type: T } & P`                |
| `SpellSchema`   | Co-locates request and response types per spell operation       |
| `Spell<Key>`    | Typed generator for a specific spell operation key              |
| `Request`       | Union of all yieldable types (derived from `SpellSchema`)       |
| `Response`      | Union of all response types returned by `process()`             |
| `Render`        | Generator for rendering — components, elements, and children    |
| `Builder`       | `() => Render \| Render[]` - Element children factory           |
| `Component<P?>` | `() => Render` (no args) or `(props: P) => Render` (with props) |

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

The rendering context holds state and methods during rendering. Core fields include `parent`, `currentElement`, `plugins`, `processChildren`, and `createChildContext`. Plugins extend it via `declare module`:

```typescript
interface RenderContext {
  parent: Node;
  currentElement: Element | null;
  plugins: Map<string, Plugin>;
  processChildren(builder: Builder, options?: { parent?: Node }): void;
  createChildContext(parent: Node): RenderContext;
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
