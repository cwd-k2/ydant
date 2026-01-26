# @ydant/core

Rendering engine and plugin system for Ydant.

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
function mount(component: Component, container: HTMLElement, options?: MountOptions): void;

interface MountOptions {
  plugins?: Plugin[];
}
```

### Plugin System

```typescript
interface Plugin {
  name: string;
  types: string[];
  process(child: Child, api: PluginAPI): PluginResult;
}

interface PluginResult {
  value?: unknown; // Value to pass back via next()
  stop?: boolean; // Stop processing this child
}
```

### Types

| Type          | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| `Tagged<T,P>` | Helper type for tagged unions: `{ type: T } & P`                      |
| `Child`       | Union of all yieldable types (extended by plugins)                    |
| `ChildNext`   | Union of values passed via `next()` (extended by plugins)             |
| `ChildReturn` | Union of return values (extended by plugins)                          |
| `Render`      | `Generator<Child, ChildReturn, ChildNext>` - Base rendering generator |
| `Component`   | `() => Render` - Root component type                                  |
| `Builder`     | `() => Instructor \| Instruction[]` - Element factory argument        |
| `Instructor`  | `Iterator<Child, ChildReturn, ChildNext>` - Internal iterator         |
| `Instruction` | `Generator<Child, ChildReturn, ChildNext>` - Primitive return type    |

### Plugin Extension Interfaces

Plugins can extend these interfaces via module augmentation:

```typescript
declare module "@ydant/core" {
  interface PluginChildExtensions {
    MyType: Tagged<"mytype", { value: string }>;
  }
  interface PluginNextExtensions {
    MyResult: MyResultType;
  }
  interface PluginReturnExtensions {
    MyResult: MyResultType;
  }
  interface PluginAPIExtensions {
    myMethod(): void;
  }
}
```

### Utilities

| Function               | Description                            |
| ---------------------- | -------------------------------------- |
| `isTagged(value, tag)` | Type guard for tagged union types      |
| `toChildren(result)`   | Normalize array/iterator to Instructor |

## Creating Plugins

```typescript
import type { Plugin, PluginAPI, PluginResult, Child } from "@ydant/core";

export function createMyPlugin(): Plugin {
  return {
    name: "my-plugin",
    types: ["mytype"],
    process(child: Child, api: PluginAPI): PluginResult {
      if ((child as { type: string }).type === "mytype") {
        // Process the child
        return { value: result };
      }
      return {};
    },
  };
}
```
