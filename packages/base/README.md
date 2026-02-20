# @ydant/base

Element factories, primitives, and base plugin for Ydant.

## Philosophy

**@ydant/base is the user-facing API that knows "how" to render.**

While `@ydant/core` is a pure engine, base provides everything users need:

- Element factories (`div`, `span`, etc.) with Props syntax
- Primitives (`text`, `cn`, `keyed`, etc.)
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
import { mount, div, p, type Component } from "@ydant/base";

const Greeting: Component = () =>
  div({ class: "greeting" }, function* () {
    yield* p("Hello World!");
  });

mount("#app", Greeting);
```

## API

### Plugin

| Function                 | Description                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `createBasePlugin()`     | Create plugin to process base elements and primitives                                                                  |
| `createDOMBackend(root)` | Create a rendering backend that injects DOM-backed `tree`, `decorate`, `interact`, and `schedule` into `RenderContext` |

The base plugin extends `RenderContext`:

```typescript
interface RenderContext {
  isCurrentElementReused: boolean;
  keyedNodes: Map<string | number, KeyedNode>;
  mountCallbacks: Array<() => void | (() => void)>;
  unmountCallbacks: Array<() => void>;
}
```

Plugin process functions access these properties directly on the context (e.g., `ctx.parent.appendChild(node)`, `ctx.mountCallbacks.push(cb)`, `ctx.keyedNodes.get(key)`).

### Element Factories

HTML elements: `div`, `span`, `p`, `button`, `input`, `h1`-`h3`, `ul`, `li`, `a`, `form`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `label`, `textarea`, `select`, `option`, `nav`, `header`, `footer`, `section`, `article`, `aside`, `main`, `img`

SVG elements: `svg`, `circle`, `ellipse`, `line`, `path`, `polygon`, `polyline`, `rect`, `g`, `defs`, `use`, `clipPath`, `mask`, `linearGradient`, `radialGradient`, `stop`, `svgText`, `tspan`

Custom elements can be created with factory helpers:

| Function                 | Description                               |
| ------------------------ | ----------------------------------------- |
| `createHTMLElement(tag)` | Create an element factory for an HTML tag |
| `createSVGElement(tag)`  | Create an element factory for an SVG tag  |

### Primitives

| Function              | Description                              |
| --------------------- | ---------------------------------------- |
| `text(content)`       | Create a text node                       |
| `cn(...items)`        | Join class names, filtering falsy values |
| `keyed(key, factory)` | Wrap a factory with a key for diffing    |
| `onMount(callback)`   | Lifecycle hook for mount                 |
| `onUnmount(callback)` | Lifecycle hook for unmount               |

Attributes, classes, styles, and event handlers are set via element Props:

```typescript
yield *
  div(
    {
      class: cn("container", isActive && "active"),
      style: { padding: "16px" },
      onClick: (e) => {
        /* e: MouseEvent */
      },
    },
    "Content",
  );
```

### Types

| Type        | Description                                       |
| ----------- | ------------------------------------------------- |
| `Slot`      | `{ readonly node: TNode }` — element handle       |
| `Element`   | Tagged type for HTML/SVG elements                 |
| `Text`      | Tagged type for text nodes                        |
| `Lifecycle` | Tagged type for lifecycle hooks                   |
| `ClassItem` | `string \| false \| null \| undefined \| 0 \| ""` |

> `Render`, `Component` types are defined in `@ydant/core`.

### refresh()

```typescript
function refresh(slot: Slot, builder: Builder): void;
```

Replaces a Slot's children by running a new Builder. The Slot is obtained from `yield*` on an element factory:

```typescript
let mySlot: Slot;

yield *
  div(function* () {
    mySlot = yield* div(() => [text("Content")]);
  });

// Later: update the content
refresh(mySlot, () => [text("Updated!")]);
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
    yield* p("Content");
  });

// Later: update the content
refresh(slot, () => [p("Updated!")]);
```

### Array Syntax

Use for static structures:

```typescript
yield * div({ class: "container" }, () => [text("Static content")]);
```

## mount()

Convenience function that sets up DOM backend and base plugin automatically:

```typescript
function mount(target: string | Element, app: Component, options?: MountOptions): MountHandle;
```

| Parameter  | Type                | Description                                    |
| ---------- | ------------------- | ---------------------------------------------- |
| `target`   | `string \| Element` | CSS selector or DOM Element                    |
| `app`      | `Component`         | Root component function                        |
| `options?` | `MountOptions`      | Additional plugins, scheduler, backend options |

```typescript
interface MountOptions {
  plugins?: Plugin[];
  scheduler?: Scheduler;
  backend?: DOMBackendOptions;
}
```

Examples:

```typescript
// Minimal
mount("#app", App);

// With plugins
mount("#app", App, {
  plugins: [createReactivePlugin(), createContextPlugin()],
});
```

For advanced use cases (Canvas, SSR, embed), use `scope()` from `@ydant/core` directly.

## `@ydant/base/internals`

Internal APIs for extension plugin authors (SSR hydration, Canvas plugin, etc.). Not needed by application code.

```typescript
import { processNode, createSlot, executeMount, parseFactoryArgs } from "@ydant/base/internals";
import type { ProcessNodeOptions, ParsedFactoryArgs } from "@ydant/base/internals";
```

| Export               | Kind     | Description                            |
| -------------------- | -------- | -------------------------------------- |
| `processNode`        | function | Shared element processing for plugins  |
| `createSlot`         | function | Create a Slot with refresh capability  |
| `executeMount`       | function | Schedule mount callbacks for a context |
| `parseFactoryArgs`   | function | Parse element factory arguments        |
| `ProcessNodeOptions` | type     | Options for `processNode`              |
| `ParsedFactoryArgs`  | type     | Parsed result of factory arguments     |
