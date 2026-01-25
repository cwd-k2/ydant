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
console.log(count());  // 0

// Update value
count.set(5);
count.update(n => n + 1);

// Create computed value
const doubled = computed(() => count() * 2);
console.log(doubled());  // 12

// Run effects
const dispose = effect(() => {
  console.log(`Count: ${count()}`);
});

count.set(10);  // Logs: "Count: 10"
dispose();      // Stop tracking
```

### With DOM (reactive primitive)

```typescript
import { div, button, text, on, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";
import { signal, reactive, createReactivePlugin } from "@ydant/reactive";

const count = signal(0);

const Counter: Component = () =>
  div(function* () {
    // Auto-update on signal change
    yield* reactive(() => [text(`Count: ${count()}`)]);
    
    yield* button(() => [
      on("click", () => count.update(n => n + 1)),
      text("Increment"),
    ]);
  });

mount(Counter, document.getElementById("app")!, {
  plugins: [createReactivePlugin()],
});
```

## API

### signal

```typescript
function signal<T>(initialValue: T): Signal<T>;

interface Signal<T> {
  (): T;                        // Read
  set(value: T): void;          // Write
  update(fn: (v: T) => T): void; // Update with function
}
```

### computed

```typescript
function computed<T>(fn: () => T): Computed<T>;

interface Computed<T> {
  (): T;  // Read (automatically tracks dependencies)
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

Batches multiple signal updates to trigger effects only once.

### createReactivePlugin

```typescript
function createReactivePlugin(): DomPlugin;
```

Creates a DOM plugin that handles `reactive` blocks. Must be passed to `mount()`.

## Module Structure

- `types.ts` - Subscriber type
- `signal.ts` - Signal implementation
- `computed.ts` - Computed implementation
- `effect.ts` - Effect implementation
- `batch.ts` - Batch functionality
- `reactive.ts` - reactive primitive
- `plugin.ts` - DOM plugin
- `tracking.ts` - Subscription tracking (internal)
