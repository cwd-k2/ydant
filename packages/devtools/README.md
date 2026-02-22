# @ydant/devtools

Developer tools for Ydant -- opt-in Engine lifecycle observation via monkey-patching. Zero overhead when not registered.

## Installation

```bash
pnpm add @ydant/devtools
```

## Usage

### Plugin only (headless)

```typescript
import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin } from "@ydant/base";
import { createDevtoolsPlugin } from "@ydant/devtools";

const devtools = createDevtoolsPlugin({
  onEvent: (e) => console.log(e.type, e.engineId),
  bufferSize: 500,
});

const handle = scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  devtools,
]).mount(App);

// Read buffered events
console.log(devtools.getEvents());

// Clear buffer
devtools.clearEvents();
```

### Overlay UI

`createDevtoolsOverlay` provides a visual event log built with Ydant itself. The overlay runs in its own mount scope, separate from the application being observed.

Requires `@ydant/base` and `@ydant/reactive` as peer dependencies.

```typescript
import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin } from "@ydant/base";
import { createDevtoolsOverlay } from "@ydant/devtools";

const overlay = createDevtoolsOverlay();

const handle = scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  overlay.plugin,
]).mount(App);

// Connect to the Hub and mount the overlay into document.body
overlay.connect(handle.hub);

// Later: tear down the overlay
overlay.dispose();
```

## API

### createDevtoolsPlugin

```typescript
function createDevtoolsPlugin(options?: DevtoolsPluginOptions): DevtoolsPlugin;
```

Creates an opt-in DevTools plugin that instruments Engine lifecycle via monkey-patching and flush hooks. The Engine itself contains no event-firing code -- all observation is external.

The plugin wraps `enqueue`, `stop`, `pause`, `resume` on each Engine and registers `onBeforeFlush` / `onFlush` hooks. It also wraps `hub.spawn` to auto-instrument future engines.

```typescript
interface DevtoolsPluginOptions {
  /** Called for every event. Use for logging or streaming. */
  onEvent?: (event: DevtoolsEvent) => void;
  /** Maximum number of events in the ring buffer. Defaults to 1000. */
  bufferSize?: number;
}

interface DevtoolsPlugin extends Plugin {
  /** Returns the buffered events (most recent last). */
  getEvents(): readonly DevtoolsEvent[];
  /** Clears the event buffer. */
  clearEvents(): void;
}
```

### createDevtoolsOverlay

```typescript
function createDevtoolsOverlay(): DevtoolsOverlay;
```

Creates a DOM overlay that visualizes Engine lifecycle events in real time. The overlay is a self-contained Ydant application (dogfooding) mounted into `document.body` in its own scope.

```typescript
interface DevtoolsOverlay {
  /** The DevTools plugin to register in the application's scope. */
  readonly plugin: DevtoolsPlugin;
  /** Connects to the Hub and mounts the overlay UI into document.body. */
  connect(hub: Hub): void;
  /** Disposes the overlay UI. */
  dispose(): void;
}
```

Usage flow:

1. Call `createDevtoolsOverlay()` to get the overlay handle
2. Pass `overlay.plugin` into the application's `scope()` plugins array
3. After mounting, call `overlay.connect(handle.hub)` to start the UI
4. Call `overlay.dispose()` to tear down

### DevtoolsEvent

```typescript
type DevtoolsEventType =
  | "task:enqueued"
  | "flush:start"
  | "flush:end"
  | "engine:spawned"
  | "engine:stopped"
  | "engine:paused"
  | "engine:resumed"
  | "engine:error";

interface DevtoolsEvent {
  readonly type: DevtoolsEventType;
  readonly engineId: string;
  readonly timestamp: number;
  readonly [key: string]: unknown;
}
```

| Event type       | Trigger                                   |
| ---------------- | ----------------------------------------- |
| `task:enqueued`  | `engine.enqueue()` is called              |
| `flush:start`    | Before a flush cycle begins               |
| `flush:end`      | After a flush cycle completes             |
| `engine:spawned` | A new Engine is created via `hub.spawn()` |
| `engine:stopped` | `engine.stop()` is called                 |
| `engine:paused`  | `engine.pause()` is called                |
| `engine:resumed` | `engine.resume()` is called               |
| `engine:error`   | An error is observed on the Engine        |

## Peer Dependencies

| Package           | Required      | Purpose                                   |
| ----------------- | ------------- | ----------------------------------------- |
| `@ydant/core`     | Yes           | Plugin interface, Hub, Engine             |
| `@ydant/base`     | No (optional) | Required only for `createDevtoolsOverlay` |
| `@ydant/reactive` | No (optional) | Required only for `createDevtoolsOverlay` |

`createDevtoolsPlugin` depends only on `@ydant/core`. The overlay additionally requires `@ydant/base` and `@ydant/reactive` to render its UI.

## Module Structure

- `events.ts` - Event types (`DevtoolsEventType`, `DevtoolsEvent`)
- `plugin.ts` - Plugin implementation (`createDevtoolsPlugin`)
- `overlay.ts` - Overlay UI (`createDevtoolsOverlay`)
