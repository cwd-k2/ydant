# Ydant - Generator-based DOM Rendering DSL

## Overview

Ydant is a lightweight DOM rendering library using JavaScript generators as a DSL. It provides a declarative way to build UI components with dependency injection support via `inject`/`provide` pattern.

## Project Structure

```
ydant/
├── packages/
│   ├── interface/     # Core type definitions
│   ├── composer/      # Component composition & native elements
│   └── renderer/      # DOM rendering engine
├── examples/
│   └── showcase1/     # Demo application
├── package.json       # Root workspace config
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Package Dependencies

```
@ydant/interface  (core types)
       ↑
@ydant/composer   (depends on interface)
       ↑
@ydant/renderer   (peer depends on interface)
       ↑
showcase1         (depends on composer & renderer)
```

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run showcase1 dev server
cd examples/showcase1 && pnpm run dev

# Type check (in any package or example)
pnpm tsc --noEmit
```

## Core Concepts

### Tagged Union Types

All types use a tagged union pattern with `type` discriminator:

```typescript
type Tagged<T extends string, P = {}> = { type: T } & P;

// Examples
type Attribute = Tagged<"attribute", { key: string; value: string }>;
type Listener = Tagged<"listener", { key: string; value: (e: Event) => void }>;
type Text = Tagged<"text", { content: string }>;
type Element = Tagged<"element", { tag: string; holds: Children; extras?: Decoration[] }>;
```

Use `isTagged(value, "tagname")` for type guards.

### Generator-based DSL

Two syntaxes are supported:

**Generator syntax** (when Refresher is needed):
```typescript
div(function* () {
  yield* clss(["container"]);
  const refresh = yield* p(function* () {
    yield* text("Hello");
  });
  // refresh can be used to re-render the <p> element
});
```

**Array syntax** (for static structures):
```typescript
div(() => [
  clss(["container"]),
  p(() => [text("Hello")]),
]);
```

### Component System

Components are defined with `compose<Props>()`:

```typescript
interface DialogProps {
  title: string;
  onClose: () => void;
}

const Dialog = compose<DialogProps>(function* (inject) {
  // Receive props via inject
  const title = yield* inject("title");
  const onClose = yield* inject("onClose");

  // Return single root element
  return div(() => [
    clss(["dialog"]),
    h1(() => [text(title)]),
    button(() => [on("click", onClose), text("Close")]),
  ]);
});
```

Components are used with `provide`:

```typescript
yield* Dialog(function* (provide) {
  yield* provide("title", "Welcome");
  yield* provide("onClose", () => console.log("closed"));
  // Can also add decorations to root element
  yield* clss(["custom-class"]);
});
```

### Refresher

Elements return a `Refresher` function for re-rendering:

```typescript
let count = 0;
const refresh = yield* p(function* () {
  yield* text(`Count: ${count}`);
});

// Later, to update:
count++;
refresh(() => [text(`Count: ${count}`)]);
```

### App & Mount

The root component uses `Component<{}>` (aliased as `App`):

```typescript
const Main = compose<{}>(function* () {
  return div(function* () {
    yield* text("Hello World");
  });
});

// Mount to DOM
mount(Main, document.getElementById("app")!);
```

## File Reference

### packages/interface/src/index.ts

Core type definitions:
- `Tagged<T, P>` - Tagged union helper
- `isTagged(value, tag)` - Unified type guard
- `Attribute`, `Listener`, `Text` - Primitive types
- `Decoration` - Attribute | Listener
- `Child` - Element | Decoration | Text
- `Children`, `ChildrenFn`, `ChildGen` - Child iteration types
- `toChildren(result)` - Normalize array/iterator to Children
- `Element` - HTML element with holds & extras
- `ElementGenerator` - Generator yielding Elements
- `Refresher` - Re-render callback
- `Inject<K>`, `Provide<K,V>` - DI types
- `InjectorFn<T>`, `ProviderFn<T>` - DI function types
- `BuildFn<T>`, `RenderFn<T>` - Component function types
- `Component<T>`, `App` - Component types

### packages/composer/src/

- `composer.ts` - `compose<T>()` function implementation
- `native.ts` - HTML element factories (div, span, p, button, etc.)
- `primitives.ts` - `attr()`, `clss()`, `on()`, `text()`
- `index.ts` - Re-exports everything

### packages/renderer/src/index.ts

- `mount(app, parent)` - Mount App to DOM element
- `processElement()` - Render Element to HTMLElement
- `processIterator()` - Process child iterator

## Design Decisions

1. **Single-root components**: Each component returns exactly one Element
2. **extras field**: Decorations from usage site are merged into root element's `extras`
3. **render-first execution**: In `compose()`, the render phase (provide) runs before build phase (inject)
4. **Generator for Refresher**: Use generator syntax when you need the Refresher return value
5. **Array for static**: Use array syntax for static structures that don't need updates

## Development Notes

- Uses `@ydant/dev` custom condition for development (resolves to source `.ts` files)
- Production builds use `dist/` output
- Vite handles both dev server and production builds
- pnpm workspaces for monorepo management
