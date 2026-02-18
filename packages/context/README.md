# @ydant/context

Context API for Ydant.

## Installation

```bash
pnpm add @ydant/context
```

## Usage

### Context API

```typescript
import { scope, type Component } from "@ydant/core";
import { createDOMBackend, createBasePlugin, div, text } from "@ydant/base";
import { createContext, provide, inject, createContextPlugin } from "@ydant/context";

// Create context with optional default value
const ThemeContext = createContext<"light" | "dark">("light");

// Parent component provides value
const App: Component = () =>
  div(function* () {
    yield* provide(ThemeContext, "dark");
    yield* ChildComponent();
  });

// Child component injects value
const ChildComponent: Component = () =>
  div(function* () {
    const theme = yield* inject(ThemeContext);
    yield* text(`Theme: ${theme}`); // "dark"
  });

// Mount with backend and plugins
scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createContextPlugin(),
]).mount(App);
```

> **Note:** `@ydant/base` is required for DOM rendering.

## API

### createContext

```typescript
function createContext<T>(defaultValue?: T): Context<T>;
```

Creates a context object that can be provided and injected.

### provide

```typescript
function* provide<T>(context: Context<T>, value: T): Spell<"context-provide">;
```

Provides a value to all descendant components. Use with `yield*`.

### inject

```typescript
function* inject<T>(context: Context<T>): Generator<ContextInject, T, T>;
```

Retrieves the value from the nearest ancestor provider. Use with `yield*`. Returns the default value if no provider is found.

### createContextPlugin

```typescript
function createContextPlugin(): Plugin;
```

Creates a plugin that handles `provide` and `inject`. Must be included in the `scope()` plugins array. Depends on `createBasePlugin()`.

The context plugin extends `RenderContext`:

```typescript
interface RenderContext {
  contextValues: Map<symbol, unknown>;
}
```

The process function accesses `ctx.contextValues` directly (e.g., `ctx.contextValues.get(id)`, `ctx.contextValues.set(id, value)`).

## Module Structure

- `context.ts` - Context creation and provide/inject
- `plugin.ts` - Plugin implementation
