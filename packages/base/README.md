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
import { mount, type Component } from "@ydant/core";
import { createBasePlugin, div, p, text, classes } from "@ydant/base";

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
  getUnmountCallbacks(): Array<() => void>;

  // Keyed elements
  getKeyedNode(key: string | number): KeyedNode | undefined;
  setKeyedNode(key: string | number, node: KeyedNode): void;
  deleteKeyedNode(key: string | number): void;
}
```

### Element Factories

HTML elements: `div`, `span`, `p`, `button`, `input`, `h1`-`h3`, `ul`, `li`, `a`, `form`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `textarea`, `select`, `option`, `nav`, `header`, `footer`, `section`, `article`, `aside`, `main`, `img`

SVG elements: `svg`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`, `g`, `defs`, `use`, `clipPath`, `mask`, `linearGradient`, `radialGradient`, `stop`, `svgText`, `tspan`

Custom elements can be created with factory helpers:

| Function                 | Description                               |
| ------------------------ | ----------------------------------------- |
| `createHTMLElement(tag)` | Create an element factory for an HTML tag |
| `createSVGElement(tag)`  | Create an element factory for an SVG tag  |

### Primitives

| Function              | Description                           |
| --------------------- | ------------------------------------- |
| `text(content)`       | Create a text node                    |
| `attr(key, value)`    | Set an HTML attribute                 |
| `classes(...names)`   | Set class attribute                   |
| `on(event, handler)`  | Add event listener                    |
| `style(styles)`       | Set inline styles                     |
| `keyed(key, factory)` | Wrap a factory with a key for diffing |
| `onMount(callback)`   | Lifecycle hook for mount              |
| `onUnmount(callback)` | Lifecycle hook for unmount            |

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

| Type            | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `Slot`          | `{ readonly node: HTMLElement, refresh: (children) => void }`  |
| `SlotRef`       | Reference holder for a `Slot`, created by `createSlotRef()`    |
| `ElementRender` | `Generator<Element, Slot, ChildNext>` - Element factory return |
| `Element`       | Tagged type for HTML/SVG elements                              |
| `Attribute`     | Tagged type for attributes                                     |
| `Listener`      | Tagged type for event listeners                                |
| `Text`          | Tagged type for text nodes                                     |
| `Lifecycle`     | Tagged type for lifecycle hooks                                |
| `Decoration`    | Union type `Attribute \| Listener`                             |

> `Render`, `Component` types are defined in `@ydant/core`.

### createSlotRef

```typescript
function createSlotRef(): SlotRef;

interface SlotRef {
  readonly current: Slot | null;
  bind(slot: Slot): void;
  refresh(children: Builder): void;
  readonly node: HTMLElement | null;
}
```

Creates a reference holder for a `Slot`. Use `bind()` to associate a Slot, then `refresh()` and `node` to interact with it:

```typescript
const ref = createSlotRef();

yield *
  div(function* () {
    ref.bind(yield* div(() => [text("Content")]));
  });

// Later: update via ref
ref.refresh(() => [text("Updated!")]);
```

### keyed() and Element Reuse

`keyed()` wraps an element factory or component, attaching a key for list diffing. The same key will reuse the existing DOM element:

```typescript
yield *
  ul(function* () {
    for (const item of items) {
      yield* keyed(item.id, li)(() => [text(item.name)]);
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
