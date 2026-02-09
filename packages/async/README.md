# @ydant/async

Async components for Ydant: Suspense, ErrorBoundary, and Resource.

## Installation

```bash
pnpm add @ydant/async
```

## Usage

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

## Module Structure

- `Suspense.ts` - Suspense component
- `ErrorBoundary.ts` - ErrorBoundary component
- `resource.ts` - createResource
