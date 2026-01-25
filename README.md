# Ydant

**Y**ou **D**on't **A**ctually **N**eed **T**his - A generator-based DOM rendering DSL for JavaScript.

[日本語版 README](./README.ja.md)

## What is this?

Ydant is an experimental UI library that uses JavaScript generators as a domain-specific language for building DOM structures. It's deliberately minimal and unconventional—a playground for exploring what's possible when generators meet the DOM.

```typescript
import { div, span, button, text, clss, on, type Slot } from "@ydant/core";

function Counter(initial: number) {
  let count = initial;
  let countSlot: Slot;

  return div(function* () {
    yield* clss(["counter"]);

    countSlot = yield* span(function* () {
      yield* text(`Count: ${count}`);
    });

    yield* button(function* () {
      yield* on("click", () => {
        count++;
        countSlot.refresh(() => [text(`Count: ${count}`)]);
      });
      yield* text("+1");
    });
  });
}
```

## Features

- **Generator-based DSL** - Use `yield*` to compose DOM elements naturally
- **Two syntaxes** - Generator syntax for Slot access, array syntax for static structures
- **Simple function components** - Plain functions that take props and return generators
- **Slot pattern** - Fine-grained updates without virtual DOM diffing
- **Signal-based reactivity** - Optional reactive system with signals and computed values
- **Plugin architecture** - Extensible renderer with pluggable features
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
import { div, text, clss, type Component } from "@ydant/core";
import { mount } from "@ydant/dom";

const App: Component = () =>
  div(() => [
    clss(["app"]),
    text("Hello, Ydant!"),
  ]);

mount(App, document.getElementById("root")!);
```

## Syntax Options

### Generator Syntax

Use when you need the `Slot` for updates or DOM access:

```typescript
div(function* () {
  yield* clss(["container"]);

  const { refresh, node } = yield* p(function* () {
    yield* text("Dynamic content");
  });

  // Later: refresh(() => [text("Updated!")]);
  // DOM access: node.scrollIntoView();
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

Components are simple functions that take props and return a generator:

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

function Button(props: ButtonProps) {
  const { label, onClick } = props;

  return button(() => [
    clss(["btn"]),
    on("click", onClick),
    text(label),
  ]);
}
```

Use components by calling the function and yielding the result:

```typescript
yield* Button({
  label: "Click me",
  onClick: () => alert("Clicked!"),
});
```

## API Reference

### Primitives (from @ydant/core)

| Function | Description |
|----------|-------------|
| `text(content)` | Create a text node |
| `attr(key, value)` | Set an HTML attribute |
| `clss(classes[])` | Set class attribute (shorthand) |
| `on(event, handler)` | Add event listener |
| `tap(callback)` | Direct access to DOM element |
| `style(styles)` | Set inline styles |
| `key(value)` | Set key for list diffing |
| `onMount(callback)` | Lifecycle hook for mount |
| `onUnmount(callback)` | Lifecycle hook for unmount |

### Elements

All standard HTML elements are available: `div`, `span`, `p`, `button`, `input`, `h1`-`h6`, `ul`, `li`, `a`, `form`, `table`, etc.

SVG elements are also available: `svg`, `circle`, `path`, `rect`, `g`, etc.

### Mount (from @ydant/dom)

| Function | Description |
|----------|-------------|
| `mount(component, element, options?)` | Mount a component to a DOM element |

Options include `plugins` for extending the renderer.

### Reactivity (from @ydant/reactive)

| Function | Description |
|----------|-------------|
| `signal(value)` | Create a reactive signal |
| `computed(fn)` | Create a derived value |
| `effect(fn)` | Run side effects on signal changes |
| `reactive(fn)` | Auto-update DOM on signal changes |

### Type Guards

| Function | Description |
|----------|-------------|
| `isTagged(value, tag)` | Check if value has the specified type tag |

## Packages

| Package | Description |
|---------|-------------|
| [@ydant/core](./packages/core) | DSL, types, element factories, plugin interface |
| [@ydant/dom](./packages/dom) | DOM rendering engine with plugin support |
| [@ydant/reactive](./packages/reactive) | Reactivity system (signal, computed, effect) |
| [@ydant/context](./packages/context) | Context API and persistence helpers |
| [@ydant/router](./packages/router) | SPA routing (RouterView, RouterLink) |
| [@ydant/async](./packages/async) | Async components (Suspense, ErrorBoundary) |
| [@ydant/transition](./packages/transition) | CSS transitions (Transition, TransitionGroup) |

## Project Structure

```
packages/
├── core/        # DSL, types, element factories, plugin interface
├── dom/         # DOM rendering engine with plugin support
├── reactive/    # Reactivity system (signal, computed, effect)
├── context/     # Context API and persistence helpers
├── router/      # SPA routing
├── async/       # Async components (Suspense, ErrorBoundary)
└── transition/  # CSS transitions

examples/
├── showcase1/   # Counter, Dialog component
├── showcase2/   # ToDo App (CRUD, localStorage)
├── showcase3/   # Pomodoro Timer with SVG
├── showcase4/   # SPA with Plugin Architecture
├── showcase5/   # Sortable list with key()
├── showcase6/   # Async (Suspense, ErrorBoundary)
└── showcase7/   # CSS Transitions
```

## Examples

Explore working examples to see Ydant in action:

| Example | Description | Key Features |
|---------|-------------|--------------|
| [showcase1](./examples/showcase1/) | Basic demos | Counter with Slot, Dialog component |
| [showcase2](./examples/showcase2/) | ToDo App | CRUD operations, localStorage persistence, filtering |
| [showcase3](./examples/showcase3/) | Pomodoro Timer | Timer state management, SVG progress ring, mode switching |
| [showcase4](./examples/showcase4/) | SPA Demo | Router, Context, Reactive, Plugin Architecture |
| [showcase5](./examples/showcase5/) | Sortable List | Efficient list updates with key() |
| [showcase6](./examples/showcase6/) | Async Demo | Suspense, ErrorBoundary, createResource |
| [showcase7](./examples/showcase7/) | Transitions | Fade, Slide, Toast with CSS transitions |

To run an example:

```bash
cd examples/showcase1  # or showcase2, ..., showcase7
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
