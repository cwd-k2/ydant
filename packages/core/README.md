# @ydant/core

Core DSL, types, and element factories for Ydant.

## Installation

```bash
pnpm add @ydant/core
```

## Usage

```typescript
import { div, p, text, clss, on, type Component } from "@ydant/core";

const Greeting: Component = () =>
  div(function* () {
    yield* clss(["greeting"]);
    yield* p(() => [text("Hello World!")]);
  });
```

## API

### Element Factories

HTML elements: `div`, `span`, `p`, `button`, `input`, `h1`-`h6`, `ul`, `li`, `a`, `form`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `textarea`, `select`, `option`, `nav`, `header`, `footer`, `section`, `article`, `aside`, `main`, `dialog`

SVG elements: `svg`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`, `g`, `defs`, `use`, `clipPath`, `mask`, `linearGradient`, `radialGradient`, `stop`, `svgText`, `tspan`

### Primitives

| Function              | Description                  |
| --------------------- | ---------------------------- |
| `text(content)`       | Create a text node           |
| `attr(key, value)`    | Set an HTML attribute        |
| `clss(classes[])`     | Set class attribute          |
| `on(event, handler)`  | Add event listener           |
| `tap(callback)`       | Direct access to DOM element |
| `style(styles)`       | Set inline styles            |
| `key(value)`          | Set key for list diffing     |
| `onMount(callback)`   | Lifecycle hook for mount     |
| `onUnmount(callback)` | Lifecycle hook for unmount   |

### Types

| Type               | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `Component`        | `() => ElementGenerator`                                               |
| `Slot`             | `{ node: HTMLElement, refresh: (fn) => void }`                         |
| `ElementGenerator` | Generator yielding Elements, returning Slot                            |
| `Child`            | Element \| Decoration \| Text \| Lifecycle \| Style \| Key \| Reactive |

### Utilities

| Function               | Description                          |
| ---------------------- | ------------------------------------ |
| `isTagged(value, tag)` | Type guard for tagged union types    |
| `toChildren(result)`   | Normalize array/iterator to Children |

## Syntax

### Generator Syntax

Use when you need the `Slot` return value:

```typescript
const { refresh, node } =
  yield *
  div(function* () {
    yield* text("Content");
  });
```

### Array Syntax

Use for static structures:

```typescript
yield * div(() => [clss(["container"]), text("Static content")]);
```
