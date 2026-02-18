# @ydant/portal

Portal spell for rendering content into alternate DOM targets.

## Installation

```bash
pnpm add @ydant/portal
```

## Usage

```typescript
import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin, div, attr, text } from "@ydant/base";
import { createPortalPlugin, portal } from "@ydant/portal";

const modalContainer = document.getElementById("modals")!;

function* App() {
  yield* div(() => [text("Main content")]);
  yield* portal(modalContainer, () => [
    div(() => [attr("class", "modal"), text("I render outside the main tree!")]),
  ]);
}

scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createPortalPlugin(),
]).mount(App);
```

The portal's children render into `modalContainer` instead of the app root. This is useful for modals, tooltips, and dropdowns that need to escape their parent's overflow or stacking context.

## API

### `portal(target, content)`

```typescript
function* portal(target: unknown, content: Builder): Spell<"portal">;
```

Renders `content` into `target` instead of the current parent node.

- `target` — The DOM node (or any render target node) to render into.
- `content` — A builder function that yields the portal's children.

When the parent scope is unmounted or refreshed, the portal's children are cleaned up (via `clearChildren` on the target).

### `createPortalPlugin()`

```typescript
function createPortalPlugin(): Plugin;
```

Creates the portal plugin. Must be registered alongside `createBasePlugin()`.

The plugin declares a dependency on `"base"` and handles `"portal"` type requests.

## Limitations

- **Multiple portals to the same target** — When two portals share the same target node and one is unmounted (e.g., via `Slot.refresh()`), `clearChildren` removes all children from the target, including the other portal's content. Use separate target nodes for independent portals.
- **Lifecycle hooks require element scope** — `onMount` and `onUnmount` work inside portal content, but they must be placed inside an element (e.g., inside `div()`), not at the portal's root level.
