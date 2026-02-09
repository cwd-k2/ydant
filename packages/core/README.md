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
  /** Extend RenderAPI with plugin-specific methods */
  extendAPI?(api: Partial<RenderAPI>, ctx: RenderContext): void;
  /** Merge child context state into parent context (called after processChildren) */
  mergeChildContext?(parentCtx: RenderContext, childCtx: RenderContext): void;
  /** Process an instruction and return feedback for the generator */
  process(instruction: Instruction, api: RenderAPI): Feedback;
}
```

### Types

| Type            | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `Tagged<T,P>`   | Helper type for tagged unions: `{ type: T } & P`                |
| `DSLSchema`     | Co-locates instruction and feedback types per DSL operation     |
| `DSL<Key>`      | Typed generator for a specific DSL operation key                |
| `Instruction`   | Union of all yieldable types (derived from `DSLSchema`)         |
| `Feedback`      | Union of all feedback types returned by `process()`             |
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

  // Extend RenderAPI with custom methods
  interface RenderAPI {
    myMethod(): void;
  }

  // Co-locate instruction, feedback, and return types per DSL operation
  interface DSLSchema {
    mytype: { instruction: Tagged<"mytype", { value: string }>; feedback: MyResultType };
    // return omitted → falls back to feedback (MyResultType)
    // Use explicit `return` when it differs from feedback:
    // "other": { instruction: OtherType; feedback: Bar; return: Baz };
    // Or for return-only entries (no instruction):
    // "composite": { return: CompositeHandle };
  }
}

// Use DSL<Key> for typed generators
function* myOperation(): DSL<"mytype"> {
  const result = yield myInstruction; // result is MyResultType
  return result;
}
```

### RenderContext

The rendering context holds state during rendering. Plugins extend it via `declare module`:

```typescript
interface RenderContext {
  parent: Node;
  currentElement: Element | null;
  plugins: Map<string, Plugin>;
}
```

### Utilities

| Function               | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `isTagged(value, tag)` | Type guard for tagged union types                 |
| `toRender(result)`     | Normalize `Render \| Render[]` to single `Render` |

## Creating Plugins

```typescript
import type { Instruction, Feedback, Plugin, RenderAPI } from "@ydant/core";

// 1. Declare type extensions
declare module "@ydant/core" {
  interface RenderContext {
    myData: Map<string, unknown>;
  }
  interface RenderAPI {
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

    // Extend RenderAPI with methods
    extendAPI(api, ctx) {
      api.getMyData = (key: string) => ctx.myData.get(key);
      api.setMyData = (key: string, value: unknown) => ctx.myData.set(key, value);
    },

    // Process instructions
    process(instruction: Instruction, api: RenderAPI): Feedback {
      if ((instruction as { type: string }).type === "mytype") {
        // Process the instruction using api.getMyData(), api.setMyData()
        return result;
      }
    },
  };
}
```
