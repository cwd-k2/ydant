# Ydant

**Y**ou **D**on't **A**ctually **N**eed **T**his - A generator-based DOM rendering DSL for JavaScript.

[日本語版 README](./README.ja.md)

## What is this?

Ydant is an experimental UI library that uses JavaScript generators as a domain-specific language for building DOM structures. It's deliberately minimal and unconventional—a playground for exploring what's possible when generators meet the DOM.

```typescript
const Counter = compose<{ initial: number }>(function* (inject) {
  let count = yield* inject("initial");

  return div(function* () {
    yield* clss(["counter"]);

    const refresh = yield* span(function* () {
      yield* text(`Count: ${count}`);
    });

    yield* button(function* () {
      yield* on("click", () => {
        count++;
        refresh(() => [text(`Count: ${count}`)]);
      });
      yield* text("+1");
    });
  });
});
```

## Features

- **Generator-based DSL** - Use `yield*` to compose DOM elements naturally
- **Two syntaxes** - Generator syntax for reactive updates, array syntax for static structures
- **Component system** - `compose<Props>()` with dependency injection via `inject`/`provide`
- **Refresher pattern** - Fine-grained updates without virtual DOM diffing
- **Tiny footprint** - No dependencies, minimal abstraction
- **TypeScript-first** - Full type safety with tagged union types

## Installation

```bash
# This is a monorepo - clone and use locally
git clone https://github.com/your-username/ydant.git
cd ydant
pnpm install
pnpm -r run build
```

## Quick Start

```typescript
import { compose, div, button, text, clss, on } from "@ydant/core";
import { mount } from "@ydant/dom";

const App = compose<{}>(function* () {
  return div(() => [
    clss(["app"]),
    text("Hello, Ydant!"),
  ]);
});

mount(App, document.getElementById("root")!);
```

## Syntax Options

### Generator Syntax

Use when you need the `Refresher` for updates:

```typescript
div(function* () {
  yield* clss(["container"]);

  const refresh = yield* p(function* () {
    yield* text("Dynamic content");
  });

  // Later: refresh(() => [text("Updated!")]);
});
```

### Array Syntax

Use for static structures:

```typescript
div(() => [
  clss(["container"]),
  p(() => [text("Static content")]),
]);
```

## Components

Define components with `compose<Props>()`:

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

const Button = compose<ButtonProps>(function* (inject) {
  const label = yield* inject("label");
  const onClick = yield* inject("onClick");

  return button(() => [
    clss(["btn"]),
    on("click", onClick),
    text(label),
  ]);
});
```

Use components with `provide`:

```typescript
yield* Button(function* (provide) {
  yield* provide("label", "Click me");
  yield* provide("onClick", () => alert("Clicked!"));
  // Add extra attributes to root element
  yield* clss(["primary"]);
});
```

## API Reference

### Primitives

| Function | Description |
|----------|-------------|
| `text(content)` | Create a text node |
| `attr(key, value)` | Set an HTML attribute |
| `clss(classes[])` | Set class attribute (shorthand) |
| `on(event, handler)` | Add event listener |

### Elements

All standard HTML elements are available: `div`, `span`, `p`, `button`, `input`, `h1`-`h3`, `ul`, `li`, `a`, `form`, `table`, etc.

### Component

| Function | Description |
|----------|-------------|
| `compose<T>(buildFn)` | Create a component with props type `T` |
| `mount(app, element)` | Mount an app to a DOM element |

### Type Guards

| Function | Description |
|----------|-------------|
| `isTagged(value, tag)` | Check if value has the specified type tag |

## Project Structure

```
packages/
├── core/        # DSL, types, component composition
└── dom/         # DOM rendering engine

examples/
├── showcase1/   # Counter, Dialog component
├── showcase2/   # ToDo App
└── showcase3/   # Pomodoro Timer
```

## Examples

Explore working examples to see Ydant in action:

| Example | Description | Key Features |
|---------|-------------|--------------|
| [showcase1](./examples/showcase1/) | Basic demos | Counter with Refresher, Dialog component with `compose` |
| [showcase2](./examples/showcase2/) | ToDo App | CRUD operations, localStorage persistence, filtering |
| [showcase3](./examples/showcase3/) | Pomodoro Timer | Timer state management, SVG progress ring, mode switching |

To run an example:

```bash
cd examples/showcase1  # or showcase2, showcase3
pnpm run dev
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run the demo
cd examples/showcase1
pnpm run dev
```

## Why "You Don't Actually Need This"?

Because you probably don't. This is an experiment in alternative approaches to UI development. If you're building production software, you should probably use React, Vue, Svelte, or SolidJS.

But if you're curious about:
- How generators can be used as a DSL
- Fine-grained reactivity without virtual DOM
- Minimal abstractions over the DOM

...then maybe you'll find something interesting here.

## License

MIT
