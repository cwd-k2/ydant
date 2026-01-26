# @ydant/context

Context API and persistence helpers for Ydant.

## Installation

```bash
pnpm add @ydant/context
```

## Usage

### Context API

```typescript
import { mount, type Component } from "@ydant/core";
import { createBasePlugin, div, text } from "@ydant/base";
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

// Mount with base and context plugins
mount(App, document.getElementById("app")!, {
  plugins: [createBasePlugin(), createContextPlugin()],
});
```

> **Note:** `@ydant/base` is required for DOM rendering.

### Persistence (localStorage)

```typescript
import { createStorage, persist, save, remove } from "@ydant/context";

// Create persistent storage
const themeStorage = createStorage<"light" | "dark">("theme", "light");

// Read
const theme = themeStorage.get();

// Write
themeStorage.set("dark");

// Remove
themeStorage.remove();

// Alternative: direct functions
persist("key", value); // Save
save("key", value); // Alias for persist
remove("key"); // Remove
```

## API

### createContext

```typescript
function createContext<T>(defaultValue?: T): Context<T>;
```

Creates a context object that can be provided and injected.

### provide

```typescript
function provide<T>(context: Context<T>, value: T): ContextProvide;
```

Provides a value to all descendant components. Use with `yield*`.

### inject

```typescript
function inject<T>(context: Context<T>): ContextInject;
```

Retrieves the value from the nearest ancestor provider. Use with `yield*`. Returns the default value if no provider is found.

### createStorage

```typescript
function createStorage<T>(key: string, defaultValue: T): Storage<T>;

interface Storage<T> {
  get(): T;
  set(value: T): void;
  remove(): void;
}
```

Creates a localStorage-backed storage with JSON serialization.

### createContextPlugin

```typescript
function createContextPlugin(): Plugin;
```

Creates a plugin that handles `provide` and `inject`. Must be passed to `mount()`.

The context plugin extends `RenderContext` and `PluginAPI`:

```typescript
// RenderContext extensions
interface RenderContextExtensions {
  contextValues: Map<symbol, unknown>;
}

// PluginAPI extensions
interface PluginAPIExtensions {
  getContext<T>(id: symbol): T | undefined;
  setContext<T>(id: symbol, value: T): void;
}
```

## Module Structure

- `context.ts` - Context creation and provide/inject
- `persist.ts` - localStorage helpers
- `plugin.ts` - Plugin implementation
