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
import { div, h1, p } from "@ydant/base";
import { renderToString } from "@ydant/ssr";

const App: Component = () =>
  div({ class: "container" }, () => [h1(() => [p("Hello, SSR!")]), p("Rendered on the server.")]);

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

### createSSRBackend (low-level)

```typescript
import { scope } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import { createSSRBackend } from "@ydant/ssr";

const ssr = createSSRBackend();
const handle = scope(ssr, [createBasePlugin()]).mount(App);

const html = ssr.toHTML();
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

### createSSRBackend

```typescript
function createSSRBackend(): SSRBackend;

interface SSRBackend extends Backend<"tree" | "decorate" | "interact" | "schedule"> {
  readonly root: VRoot;
  toHTML(): string;
}
```

Creates a rendering backend for SSR that builds a virtual node tree. Pass it to `scope()` as the backend. Call `toHTML()` after mounting to get the HTML string.

### hydrate

```typescript
function hydrate(app: Component, root: HTMLElement, options?: HydrateOptions): MountHandle;

interface HydrateOptions {
  plugins?: Plugin[];
}
```

Walks existing DOM nodes and attaches behavior. Returns a mount handle for disposal.

### createDOMNodeResolver

```typescript
function createDOMNodeResolver(): ResolveCapability;
```

Creates a `ResolveCapability` backed by the browser DOM. Each parent node has its own cursor position (tracked via WeakMap). Successive calls to `nextChild(parent)` return `childNodes[0]`, `childNodes[1]`, etc.

Used internally by `hydrate()`, but exported for building custom hydration strategies.

### createHydrationPlugin

```typescript
function createHydrationPlugin(resolver: ResolveCapability): Plugin;
```

Creates a plugin that wraps the base plugin with hydration behavior. During the initial render pass:

- **Element requests**: acquire existing DOM node via resolver (skip create + append)
- **Text requests**: advance resolver cursor (skip create + append)
- **Attribute requests**: skip (already set by SSR)
- **Listener requests**: apply (this is the purpose of hydration)
- **Lifecycle requests**: apply (mount hooks may initialize state)

After the initial render completes (via `setup()`), all subsequent requests delegate to the base plugin for normal DOM rendering. This enables Slot.refresh() to work normally after hydration.

Used internally by `hydrate()`, but exported for building custom hydration pipelines with `scope()` directly.

## Architecture

### DSL Reinterpretation

Hydration works by **reinterpreting** the same DSL requests differently:

| DSL Request                       | Normal Rendering                 | Hydration                   |
| --------------------------------- | -------------------------------- | --------------------------- |
| Element (`yield* div(...)`)       | `createElement` + `appendChild`  | Walk to next existing child |
| Text (`yield* text(...)`)         | `createTextNode` + `appendChild` | Advance cursor (skip)       |
| Props (attributes)                | `setAttribute`                   | Skip (already set by SSR)   |
| Props (event handlers)            | `addEventListener`               | `addEventListener`          |
| Lifecycle (`yield* onMount(...)`) | Register callback                | Register callback           |

### ResolveCapability Layer

The ability to find existing DOM nodes is provided by the **ResolveCapability** — a capability injected only during hydration:

- **Backend** (e.g., `createDOMBackend`, `createSSRBackend`): injects `tree`, `decorate`, `interact`, `schedule` into `RenderContext`
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
- `target.ts` - `createSSRBackend()` backend implementation
- `render.ts` - `renderToString()` high-level API
- `resolver.ts` - `ResolveCapability` implementation for DOM hydration
- `hydrate.ts` - `hydrate()` and hydration plugin
