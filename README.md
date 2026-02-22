# Ydant

**Y**ou **D**on't **A**ctually **N**eed **T**his - A generator-based DOM rendering DSL for JavaScript.

[日本語版 README](./README.ja.md)

## What is this?

Ydant is an experimental UI library that uses JavaScript generators as a domain-specific language for building DOM structures. It's deliberately minimal and unconventional—a playground for exploring what's possible when generators meet the DOM.

```typescript
import { scope } from "@ydant/core";
import {
  createDOMBackend,
  createBasePlugin,
  div,
  button,
  text,
  refresh,
  type Slot,
} from "@ydant/base";

function Counter(initial: number) {
  let count = initial;
  let countSlot: Slot;

  return div({ class: "counter" }, function* () {
    countSlot = yield* div(() => [text(`Count: ${count}`)]);

    yield* button(
      {
        onClick: () => {
          count++;
          refresh(countSlot, () => [text(`Count: ${count}`)]);
        },
      },
      "+1",
    );
  });
}

scope(createDOMBackend(document.getElementById("app")!), [createBasePlugin()]).mount(() =>
  Counter(0),
);
```

## Features

- **Generator-based DSL** - Use `yield*` to compose DOM elements naturally
- **Two syntaxes** - Generator syntax for Slot access, array syntax for static structures
- **Simple function components** - Plain functions that take props and return generators
- **Slot pattern** - Fine-grained updates without virtual DOM diffing
- **Plugin architecture** - Extensible renderer with signals, context, and more
- **Tiny footprint** - No dependencies, minimal abstraction
- **TypeScript-first** - Full type safety with tagged union types

## Packages

| Package               | Description                         | README                                     |
| --------------------- | ----------------------------------- | ------------------------------------------ |
| **@ydant/core**       | Rendering engine, plugin system     | [Details](./packages/core/README.md)       |
| **@ydant/base**       | Element factories, primitives, Slot | [Details](./packages/base/README.md)       |
| **@ydant/reactive**   | Signal-based reactivity             | [Details](./packages/reactive/README.md)   |
| **@ydant/context**    | Context API                         | [Details](./packages/context/README.md)    |
| **@ydant/router**     | SPA routing                         | [Details](./packages/router/README.md)     |
| **@ydant/async**      | Suspense, ErrorBoundary             | [Details](./packages/async/README.md)      |
| **@ydant/transition** | CSS transitions                     | [Details](./packages/transition/README.md) |
| **@ydant/canvas**     | Canvas2D rendering                  | [Details](./packages/canvas/README.md)     |
| **@ydant/portal**     | Render into alternate targets       | [Details](./packages/portal/README.md)     |
| **@ydant/ssr**        | Server-side rendering + Hydration   | [Details](./packages/ssr/README.md)        |
| **@ydant/devtools**   | Engine lifecycle observation        | [Details](./packages/devtools/README.md)   |

## Quick Start

```typescript
import { mount, div, p, type Component } from "@ydant/base";

const App: Component = () =>
  div({ class: "app" }, function* () {
    yield* p("Hello, Ydant!");
  });

mount("#root", App);
```

### With Plugins

```typescript
import { mount, div, button, type Component } from "@ydant/base";
import { createReactivePlugin, signal, reactive } from "@ydant/reactive";
import { createContextPlugin } from "@ydant/context";

const count = signal(0);

const App: Component = () =>
  div(function* () {
    yield* reactive(() => [div(`Count: ${count()}`)]);
    yield* button({ onClick: () => count.update((n) => n + 1) }, "+1");
  });

mount("#root", App, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
```

> For advanced use cases (Canvas, SSR, embed), use `scope()` from `@ydant/core` directly.

## Examples

| Example                              | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| [showcase1](./examples/showcase1/)   | Counter, Dialog - basic Slot usage            |
| [showcase2](./examples/showcase2/)   | ToDo App - CRUD, localStorage                 |
| [showcase3](./examples/showcase3/)   | Pomodoro Timer - SVG, lifecycle               |
| [showcase4](./examples/showcase4/)   | SPA - Router, Context, plugins                |
| [showcase5](./examples/showcase5/)   | Sortable list - keyed() for efficient updates |
| [showcase6](./examples/showcase6/)   | Async - Suspense, ErrorBoundary               |
| [showcase7](./examples/showcase7/)   | Transitions - enter/leave animations          |
| [showcase9](./examples/showcase9/)   | Admin dashboard - router, auth, context       |
| [showcase10](./examples/showcase10/) | Form validation - dynamic rules               |
| [showcase11](./examples/showcase11/) | Canvas embed - DOM + Canvas2D hybrid          |
| [showcase12](./examples/showcase12/) | Portal for modal dialogs                      |
| [showcase13](./examples/showcase13/) | SSR + Hydration                               |
| [showcase14](./examples/showcase14/) | Reactive Canvas - signal-driven repaint       |
| [showcase15](./examples/showcase15/) | Multi-target dashboard (DOM/Canvas/SSR)       |
| [showcase16](./examples/showcase16/) | Priority-based rendering with Engine control  |
| [showcase17](./examples/showcase17/) | Inter-engine messaging via Hub                |
| [showcase18](./examples/showcase18/) | Multi-engine collaborative editing            |

Each example has a README with implementation tips. Run all examples:

```bash
pnpm run dev  # http://localhost:5173
```

## Installation

```bash
npm install @ydant/core @ydant/base
```

Optional packages:

```bash
npm install @ydant/reactive   # Signal-based reactivity
npm install @ydant/context    # Context API
npm install @ydant/router     # SPA routing
npm install @ydant/async      # Suspense, ErrorBoundary
npm install @ydant/transition # CSS transitions
npm install @ydant/canvas    # Canvas2D rendering
npm install @ydant/portal    # Render into alternate targets
npm install @ydant/ssr       # Server-side rendering + Hydration
```

## Development

```bash
git clone https://github.com/cwd-k2/ydant.git
cd ydant
pnpm install        # Install dependencies
pnpm -r run build   # Build all packages
pnpm run dev        # Run unified dev server
pnpm test           # Run tests (watch mode)
pnpm test:run       # Run tests (single run)
pnpm test:coverage  # Run tests with coverage
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
