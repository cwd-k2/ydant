# @ydant/base

Element factories, primitives, and base plugin for Ydant.

## Installation

```bash
pnpm add @ydant/base
```

## Usage

```typescript
import { mount } from "@ydant/core";
import { createBasePlugin, div, p, text, clss, type Component } from "@ydant/base";

const Greeting: Component = () =>
  div(function* () {
    yield* clss(["greeting"]);
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

### Element Factories

HTML elements: `div`, `span`, `p`, `button`, `input`, `h1`-`h3`, `ul`, `li`, `a`, `form`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `textarea`, `select`, `option`, `nav`, `header`, `footer`, `section`, `article`, `aside`, `main`, `img`

SVG elements: `svg`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`, `g`, `defs`, `use`, `clipPath`, `mask`, `linearGradient`, `radialGradient`, `stop`, `svgText`, `tspan`

### Primitives

| Function              | Description                |
| --------------------- | -------------------------- |
| `text(content)`       | Create a text node         |
| `attr(key, value)`    | Set an HTML attribute      |
| `clss(classes[])`     | Set class attribute        |
| `on(event, handler)`  | Add event listener         |
| `style(styles)`       | Set inline styles          |
| `key(value)`          | Set key for list diffing   |
| `onMount(callback)`   | Lifecycle hook for mount   |
| `onUnmount(callback)` | Lifecycle hook for unmount |

### Types

| Type            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `Slot`          | `{ node: HTMLElement, refresh: (fn) => void }`                   |
| `Render`        | `Generator<Child, ChildReturn, ChildNext>` - Rendering generator |
| `Component`     | `() => Render` - Root component type                             |
| `ElementRender` | `Generator<Element, Slot, ChildNext>` - Element factory return   |
| `Element`       | Tagged type for HTML/SVG elements                                |
| `Attribute`     | Tagged type for attributes                                       |
| `Listener`      | Tagged type for event listeners                                  |
| `Text`          | Tagged type for text nodes                                       |
| `Lifecycle`     | Tagged type for lifecycle hooks                                  |
| `Key`           | Tagged type for list keys                                        |

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
yield * div(() => [clss(["container"]), text("Static content")]);
```
