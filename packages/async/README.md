# @ydant/async

Async components for Ydant: Suspense, ErrorBoundary, and Resource.

## Installation

```bash
pnpm add @ydant/async
```

## Usage

```typescript
import { scope } from "@ydant/core";
import { createDOMBackend, createBasePlugin } from "@ydant/base";
import { createAsyncPlugin } from "@ydant/async";

scope(createDOMBackend(document.getElementById("app")!), [
  createBasePlugin(),
  createAsyncPlugin(),
]).mount(App);
```

`createAsyncPlugin()` is required for `chunked` to work and for `ErrorBoundary` / `Suspense` error handling during async re-renders (e.g., reactive updates).

### Suspense

```typescript
import { type Component } from "@ydant/core";
import { div, text } from "@ydant/base";
import { Suspense, createResource } from "@ydant/async";

// Create async resource
const userResource = createResource(() => fetch("/api/user").then((r) => r.json()));

// Component using resource
const UserProfile: Component = () =>
  div(function* () {
    const user = userResource();
    yield* text(`Name: ${user.name}`);
  });

// Wrap with Suspense
const App: Component = () =>
  Suspense({
    fallback: () => text("Loading..."),
    content: () => UserProfile(),
  });
```

### ErrorBoundary

```typescript
import { ErrorBoundary } from "@ydant/async";

const App: Component = () =>
  ErrorBoundary({
    fallback: (error, reset) => text(`Error: ${error.message}`),
    content: () => RiskyComponent(),
  });
```

### Combined Usage

```typescript
const App: Component = () =>
  ErrorBoundary({
    fallback: (error, reset) => text(`Error: ${error.message}`),
    content: () =>
      Suspense({
        fallback: () => text("Loading..."),
        content: () => AsyncContent(),
      }),
  });
```

## API

### Suspense

```typescript
function* Suspense(props: SuspenseProps): Render;

interface SuspenseProps {
  fallback: () => Render;
  content: () => Render;
}
```

Shows fallback while async content is loading.

### ErrorBoundary

```typescript
function* ErrorBoundary(props: ErrorBoundaryProps): Render;

interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => Render;
  content: () => Render;
}
```

Catches errors in child components and shows fallback. The `reset` callback allows retrying.

### createResource

```typescript
function createResource<T>(
  fetcher: () => Promise<T>,
  options?: {
    initialValue?: T;
    refetchInterval?: number;
  },
): Resource<T>;

interface Resource<T> {
  (): T; // Throws promise if pending, error if failed
  peek(): T; // Read without suspend (throws if pending/error)
  readonly loading: boolean;
  readonly error: Error | null;
  refetch(): Promise<void>;
  dispose(): void; // Stop auto-refetch
}
```

Creates a resource that suspends while loading.

### createAsyncPlugin

```typescript
function createAsyncPlugin(): Plugin;
```

Plugin that processes `boundary` and `chunked` spell requests. Required for:

- **ErrorBoundary / Suspense**: manages the `handleRenderError` chain on `RenderContext`, enabling error boundaries to catch errors from async render updates (e.g., reactive re-renders).
- **chunked**: renders a list in chunks, deferring later chunks to avoid blocking the main thread.

Depends on the base plugin (`dependencies: ["base"]`).

### Lazy

```typescript
function* Lazy(props: LazyProps): Spell<"element">;

interface LazyProps {
  /** Content to render when the trigger fires. */
  content: () => Render;
  /** Optional fallback to display while waiting. */
  fallback?: () => Render;
  /**
   * When to trigger rendering.
   * - "visible" — when the container enters the viewport (IntersectionObserver)
   * - "idle" — when the browser is idle (requestIdleCallback)
   * @default "visible"
   */
  trigger?: "visible" | "idle";
  /** IntersectionObserver rootMargin option. Only used with trigger: "visible". */
  rootMargin?: string;
  /** IntersectionObserver threshold option. Only used with trigger: "visible". */
  threshold?: number | number[];
}
```

Defers subtree evaluation until a trigger condition is met. Wraps content in a container element. The content is not evaluated until the trigger fires (viewport visibility or browser idle). An optional fallback is shown while waiting.

```typescript
yield *
  Lazy({
    content: function* () {
      yield* HeavyComponent();
    },
    fallback: function* () {
      yield* text("Loading...");
    },
    trigger: "visible",
    rootMargin: "200px",
  });
```

### chunked

```typescript
function* chunked<T>(
  items: readonly T[],
  chunkSize: number,
  each: (item: T, index: number) => Render,
  options?: { schedule?: (callback: () => void) => () => void },
): Spell<"chunked">;
```

Renders a list of items in chunks, deferring later chunks to avoid blocking the main thread during initial render. The first chunk is rendered synchronously; remaining chunks are deferred via a scheduler callback (`requestIdleCallback` by default).

Requires `createAsyncPlugin()` to be registered.

```typescript
yield *
  ul(function* () {
    yield* chunked(items, 50, function* (item) {
      yield* li(() => [text(item.name)]);
    });
  });
```

## Module Structure

- `Suspense.ts` - Suspense component
- `ErrorBoundary.ts` - ErrorBoundary component
- `resource.ts` - createResource
- `Lazy.ts` - Lazy component (IntersectionObserver / requestIdleCallback)
- `chunked.ts` - chunked spell
- `plugin.ts` - createAsyncPlugin
