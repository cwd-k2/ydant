# @ydant/ssr

Server-side rendering and hydration for Ydant.

- **SSR**: Renders components to HTML strings using a virtual node tree
- **Hydration**: Walks existing DOM to attach event listeners and Slot references

## Installation

```bash
pnpm add @ydant/ssr
```

## SSR

### renderToString (high-level)

```typescript
import type { Component } from "@ydant/core";
import { div, h1, p, text, classes } from "@ydant/base";
import { renderToString } from "@ydant/ssr";

const App: Component = () =>
  div(() => [
    classes("container"),
    h1(() => [text("Hello, SSR!")]),
    p(() => [text("Rendered on the server.")]),
  ]);

const html = renderToString(App);
// '<div class="container"><h1>Hello, SSR!</h1><p>Rendered on the server.</p></div>'
```

By default, `renderToString` uses `[createBasePlugin()]`. Pass custom plugins via options:

```typescript
import { createBasePlugin } from "@ydant/base";
import { createReactivePlugin } from "@ydant/reactive";

const html = renderToString(App, {
  plugins: [createBasePlugin(), createReactivePlugin()],
});
```

### createSSRCapabilities (low-level)

```typescript
import { mount } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import { createSSRCapabilities } from "@ydant/ssr";

const ssrCaps = createSSRCapabilities();
const handle = mount(App, {
  root: ssrCaps.root,
  plugins: [ssrCaps, createBasePlugin()],
});

const html = ssrCaps.toHTML();
handle.dispose();
```

## Hydration

### hydrate

```typescript
import { hydrate } from "@ydant/ssr";

// Server: generate HTML
const html = renderToString(App);

// Client: hydrate existing HTML
const root = document.getElementById("app")!;
root.innerHTML = html; // (normally set by server response)
const handle = hydrate(App, root);
```

The same component tree is "re-interpreted" — instead of creating new DOM nodes, `hydrate` walks existing ones and attaches event listeners and Slot references.

Pass additional plugins (reactive, context, etc.) via options:

```typescript
import { createReactivePlugin } from "@ydant/reactive";

hydrate(App, root, {
  plugins: [createReactivePlugin()],
});
```

Note: `createBasePlugin()` is handled internally by `hydrate()` — do not pass it in the plugins array.

## API

### renderToString

```typescript
function renderToString(app: Component, options?: RenderToStringOptions): string;

interface RenderToStringOptions {
  plugins?: Plugin[];
}
```

One-shot rendering: creates a target, mounts the component, serializes to HTML, and disposes.

### createSSRCapabilities

```typescript
function createSSRCapabilities(): SSRCapabilities;

interface SSRCapabilities extends Plugin {
  toHTML(): string;
}
```

Creates a capability provider plugin for SSR that builds a virtual node tree. Register it in the `plugins` array and use its `root` property as the mount root. Call `toHTML()` after mounting to get the HTML string.

### hydrate

```typescript
function hydrate(app: Component, root: HTMLElement, options?: HydrateOptions): MountHandle;

interface HydrateOptions {
  plugins?: Plugin[];
}
```

Walks existing DOM nodes and attaches behavior. Returns a mount handle for disposal.

## Architecture

### DSL Reinterpretation

Hydration works by **reinterpreting** the same DSL requests differently:

| DSL Request                       | Normal Rendering                 | Hydration                   |
| --------------------------------- | -------------------------------- | --------------------------- |
| Element (`yield* div(...)`)       | `createElement` + `appendChild`  | Walk to next existing child |
| Text (`yield* text(...)`)         | `createTextNode` + `appendChild` | Advance cursor (skip)       |
| Attribute (`yield* attr(...)`)    | `setAttribute`                   | Skip (already set by SSR)   |
| Listener (`yield* on(...)`)       | `addEventListener`               | `addEventListener`          |
| Lifecycle (`yield* onMount(...)`) | Register callback                | Register callback           |

### ResolveCapability Layer

The ability to find existing DOM nodes is provided by the **ResolveCapability** — a capability injected only during hydration:

- **Capability Provider** (e.g., `createDOMCapabilities`, `createSSRCapabilities`): injects `tree`, `decorate`, `interact`, `schedule` into `RenderContext`
- **Plugin**: "how to interpret DSL requests" (processing strategy)
- **ResolveCapability**: "how to find existing nodes" (cursor-based traversal, via `ctx.resolve`)

The hydration plugin decides _whether_ to create or find nodes. The resolve capability provides the _ability_ to find them.

### Post-Hydration Updates

After the initial hydration pass completes, `Slot.refresh()` uses normal DOM rendering — creating new nodes, appending, setting attributes. The hydration mode is active only during the initial mount.

## SSR Capability Behavior

| Capability | Method             | SSR behavior                 |
| ---------- | ------------------ | ---------------------------- |
| `tree`     | `createElement`    | Creates a VElement           |
| `tree`     | `createTextNode`   | Creates a VText              |
| `tree`     | `appendChild`      | Pushes to parent.children    |
| `tree`     | `removeChild`      | Splices from parent.children |
| `tree`     | `clearChildren`    | Empties children array       |
| `decorate` | `setAttribute`     | Sets on VElement.attributes  |
| `interact` | `addEventListener` | No-op                        |
| `schedule` | `scheduleCallback` | No-op                        |

## VNode Types

```typescript
interface VElement {
  kind: "element";
  tag: string;
  ns?: string;
  attributes: Map<string, string>;
  children: VNode[];
}

interface VText {
  kind: "text";
  content: string;
}

interface VRoot {
  kind: "root";
  children: VNode[];
}

type VNode = VElement | VText;
type VContainer = VElement | VRoot;
```

## Module Structure

- `vnode.ts` - VNode type definitions
- `serialize.ts` - VNode tree to HTML string conversion
- `target.ts` - `createSSRCapabilities()` capability provider implementation
- `render.ts` - `renderToString()` high-level API
- `resolver.ts` - `ResolveCapability` implementation for DOM hydration
- `hydrate.ts` - `hydrate()` and hydration plugin
