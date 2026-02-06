# @ydant/base

Element factories, primitives, and base plugin for Ydant.

## Philosophy

**@ydant/base is the user-facing API that knows "how" to render.**

While `@ydant/core` is a pure engine, base provides everything users need:

- Element factories (`div`, `span`, etc.)
- Primitives (`text`, `attr`, `on`, `style`, etc.)
- DOM operations (`appendChild`, `setCurrentElement`)
- Lifecycle management (`onMount`, `onUnmount`)
- Keyed element diffing

This separation means core remains stable, while base can evolve. Other plugins stand on equal footing with base—they extend core the same way.

## Installation

```bash
pnpm add @ydant/base
```

## Usage

```typescript
import { mount } from "@ydant/core";
import { createBasePlugin, div, p, text, classes, type Component } from "@ydant/base";

const Greeting: Component = () =>
  div(function* () {
    yield* classes("greeting");
    yield* p(() => [text("Hello World!")]);
  });

mount(Greeting, document.getElementById("app")!, {
  plugins: [createBasePlugin()],
});
```

## API

### Plugin

| Function             | Description                                |
| -------------------- | ------------------------------------------ |
| `createBasePlugin()` | Create plugin to process base DSL elements |

The base plugin extends `RenderContext` and `PluginAPI`:

```typescript
// RenderContext extensions
interface RenderContextExtensions {
  isCurrentElementReused: boolean;
  pendingKey: string | number | null;
  keyedNodes: Map<string | number, KeyedNode>;
  mountCallbacks: Array<() => void | (() => void)>;
  unmountCallbacks: Array<() => void>;
}

// PluginAPI extensions (in addition to core's parent, currentElement, processChildren, createChildAPI)
interface PluginAPIExtensions {
  // DOM operations
  readonly isCurrentElementReused: boolean;
  setCurrentElementReused(reused: boolean): void;
  appendChild(node: Node): void;
  setCurrentElement(element: Element | null): void;
  setParent(parent: Node): void;

  // Lifecycle
  onMount(callback: () => void | (() => void)): void;
  onUnmount(callback: () => void): void;
  addUnmountCallbacks(...callbacks: Array<() => void>): void;
  executeMount(): void;

  // Keyed elements
  readonly pendingKey: string | number | null;
  setPendingKey(key: string | number | null): void;
  getKeyedNode(key: string | number): KeyedNode | undefined;
  setKeyedNode(key: string | number, node: KeyedNode): void;
  deleteKeyedNode(key: string | number): void;
}
```

### Element Factories

HTML elements: `div`, `span`, `p`, `button`, `input`, `h1`-`h3`, `ul`, `li`, `a`, `form`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `textarea`, `select`, `option`, `nav`, `header`, `footer`, `section`, `article`, `aside`, `main`, `img`

SVG elements: `svg`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`, `g`, `defs`, `use`, `clipPath`, `mask`, `linearGradient`, `radialGradient`, `stop`, `svgText`, `tspan`

### Primitives

| Function              | Description                |
| --------------------- | -------------------------- |
| `text(content)`       | Create a text node         |
| `attr(key, value)`    | Set an HTML attribute      |
| `classes(...names)`   | Set class attribute        |
| `on(event, handler)`  | Add event listener         |
| `style(styles)`       | Set inline styles          |
| `key(value)`          | Set key for list diffing   |
| `onMount(callback)`   | Lifecycle hook for mount   |
| `onUnmount(callback)` | Lifecycle hook for unmount |

#### `on()` Type Overloads

`on()` provides type-safe overloads for known DOM event types:

```typescript
// Type-safe: handler receives MouseEvent
yield *
  on("click", (e) => {
    /* e: MouseEvent */
  });

// Type-safe: handler receives KeyboardEvent
yield *
  on("keydown", (e) => {
    /* e: KeyboardEvent */
  });

// Generic fallback for custom events
yield *
  on("my-event", (e) => {
    /* e: Event */
  });
```

### Types

| Type            | Description                                                         |
| --------------- | ------------------------------------------------------------------- |
| `Slot`          | `{ node: HTMLElement, refresh: (fn) => void }`                      |
| `SlotRef`       | Mutable reference holder for a `Slot`, created by `createSlotRef()` |
| `Render`        | `Generator<Child, ChildReturn, ChildNext>` - Rendering generator    |
| `Component`     | `() => Render` - Root component type                                |
| `ElementRender` | `Generator<Element, Slot, ChildNext>` - Element factory return      |
| `Element`       | Tagged type for HTML/SVG elements                                   |
| `Attribute`     | Tagged type for attributes                                          |
| `Listener`      | Tagged type for event listeners                                     |
| `Text`          | Tagged type for text nodes                                          |
| `Lifecycle`     | Tagged type for lifecycle hooks                                     |
| `Key`           | Tagged type for list keys                                           |

### createSlotRef

```typescript
function createSlotRef(): SlotRef;

interface SlotRef {
  current: Slot | null;
}
```

Creates a mutable reference to a `Slot`. Useful for capturing a Slot reference within array syntax where `yield*` is not available:

```typescript
const ref = createSlotRef();

yield *
  div(function* () {
    ref.current = yield* div(() => [text("Content")]);
  });

// Later: update via ref
ref.current?.refresh(() => [text("Updated!")]);
```

### Key and Element Reuse

When using `key()` for list items, the same key will reuse the existing DOM element:

```typescript
yield *
  ul(function* () {
    for (const item of items) {
      yield* key(item.id);
      yield* li(() => [text(item.name)]);
    }
  });
```

**Constraints when reusing keyed elements:**

- **Listeners are not re-registered**: Event handlers remain from the original element. If you need to change handlers, use a different key.
- **Lifecycle callbacks are not re-registered**: `onMount`/`onUnmount` from the original registration are kept.
- **Attributes are updated**: Attribute values are refreshed on each render.

This design assumes that components with the same key have the same structure. If you need different behavior, change the key to force a new element.

## Syntax

### Generator Syntax

Use when you need the `Slot` return value:

```typescript
const slot =
  yield *
  div(function* () {
    yield* text("Content");
  });

// Later: update the content
slot.refresh(() => [text("Updated!")]);
```

### Array Syntax

Use for static structures:

```typescript
yield * div(() => [classes("container"), text("Static content")]);
```
