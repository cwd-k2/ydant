# @ydant/reactive

Signal-based reactivity system for Ydant.

## Installation

```bash
pnpm add @ydant/reactive
```

## Usage

### Basic Signals

```typescript
import { signal, computed, effect } from "@ydant/reactive";

// Create a signal
const count = signal(0);

// Read value
console.log(count()); // 0

// Update value
count.set(5);
count.update((n) => n + 1);

// Create computed value
const doubled = computed(() => count() * 2);
console.log(doubled()); // 12

// Run effects
const dispose = effect(() => {
  console.log(`Count: ${count()}`);
});

count.set(10); // Logs: "Count: 10"
dispose(); // Stop tracking
```

### With DOM (reactive primitive)

```typescript
import { mount, type Component } from "@ydant/core";
import { createBasePlugin, div, button, text, on } from "@ydant/base";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";

const count = signal(0);

const Counter: Component = () =>
  div(function* () {
    // Auto-update on signal change
    yield* reactive(() => [text(`Count: ${count()}`)]);

    yield* button(() => [on("click", () => count.update((n) => n + 1)), text("Increment")]);
  });

mount(Counter, document.getElementById("app")!, {
  plugins: [createBasePlugin(), createReactivePlugin()],
});
```

## API

### signal

```typescript
function signal<T>(initialValue: T): Signal<T>;

interface Signal<T> extends Readable<T> {
  (): T; // Read (tracks dependencies)
  peek(): T; // Read without tracking
  set(value: T): void; // Write
  update(fn: (prev: T) => T): void; // Update with function
}
```

### computed

```typescript
function computed<T>(fn: () => T): Computed<T>;

interface Computed<T> extends Readable<T> {
  (): T; // Read (automatically tracks dependencies)
  peek(): T; // Read without tracking
}
```

### effect

```typescript
function effect(fn: () => void | (() => void)): () => void;
```

Runs `fn` immediately and re-runs when dependencies change. Returns a dispose function. If `fn` returns a cleanup function, it will be called before each re-run and on dispose.

### reactive

```typescript
function reactive(fn: () => Render): Reactive;
```

Creates a reactive block that auto-updates DOM when signals change. Use with `yield*` in generator syntax.

### batch

```typescript
function batch(fn: () => void): void;
```

Batches multiple signal updates to trigger effects only once:

```typescript
const firstName = signal("John");
const lastName = signal("Doe");

effect(() => {
  console.log(`${firstName()} ${lastName()}`);
});
// Logs: "John Doe"

batch(() => {
  firstName.set("Jane");
  lastName.set("Smith");
});
// Logs only once: "Jane Smith"
```

Without `batch`, each `set()` call would trigger the effect immediately. With `batch`, updates are collected and the effect runs only once at the end with the final values.

### createReactivePlugin

```typescript
function createReactivePlugin(): Plugin;
```

Creates a plugin that handles `reactive` blocks. Must be passed to `mount()`. Depends on `createBasePlugin()`.

### createReactiveScope

```typescript
function createReactiveScope(): ReactiveScope;
```

Creates an isolated tracking scope. Normally created automatically by the plugin's `initContext()` — you only need this when creating a standalone scope outside `mount()`.

## Scoping

Each `mount()` instance gets its own `ReactiveScope` via the plugin's `initContext()`. Signals, effects, and computed values created within a mount tree track dependencies in that scope, preventing interference between independent mount instances.

**Batch operations remain global by design** — `batch()` defers all effects regardless of scope. If batch were scoped, effects from other scopes would fire immediately during a batch, defeating its purpose.

## Module Structure

- `types.ts` - Subscriber, Readable types
- `signal.ts` - Signal implementation
- `computed.ts` - Computed implementation
- `effect.ts` - Effect implementation
- `batch.ts` - Batch functionality
- `reactive.ts` - reactive primitive
- `plugin.ts` - DOM plugin
- `scope.ts` - ReactiveScope (per-mount tracking context)
- `tracking.ts` - Subscription tracking (internal, delegates to scope)
