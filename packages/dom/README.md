# @ydant/dom

DOM rendering engine for Ydant with plugin support.

## Installation

```bash
pnpm add @ydant/dom
```

## Usage

```typescript
import { div, text, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";

const App: Component = () => div(() => [text("Hello World!")]);

mount(App, document.getElementById("app")!);
```

## API

### mount

```typescript
function mount(app: Component, parent: HTMLElement, options?: MountOptions): void;

interface MountOptions {
  plugins?: DomPlugin[];
}
```

Mount a component to a DOM element. Optionally accepts plugins to extend rendering.

### With Plugins

```typescript
import { mount } from "@ydant/dom";
import { createReactivePlugin } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";

mount(App, document.getElementById("app")!, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
```

## Plugin System

The DOM renderer can be extended with plugins. Each plugin handles specific child types.

### Plugin Interface

```typescript
interface DomPlugin {
  readonly name: string;
  readonly types: readonly string[];
  process(child: Child, api: PluginAPI): PluginResult;
}
```

### PluginAPI

```typescript
interface PluginAPI {
  readonly parent: Node;
  readonly currentElement: Element | null;
  getContext<T>(id: symbol): T | undefined;
  setContext<T>(id: symbol, value: T): void;
  onMount(callback: () => void | (() => void)): void;
  onUnmount(callback: () => void): void;
  appendChild(node: Node): void;
  processChildren(builder: Builder, options?: { parent?: Node }): void;
  createChildAPI(parent: Node): PluginAPI;
}
```

## Module Structure

- `types.ts` - KeyedNode, RenderContext interfaces
- `context.ts` - createRenderContext, createPluginAPI
- `lifecycle.ts` - executeMount, executeUnmount
- `element.ts` - processElement, applyDecorations, createSlot
- `iterator.ts` - processIterator, child processing
- `render.ts` - render function
- `index.ts` - mount function, re-exports
