# @ydant/async

Async components for Ydant: Suspense, ErrorBoundary, and Resource.

## Installation

```bash
pnpm add @ydant/async
```

## Usage

### Suspense

```typescript
import { div, text, type Component } from "@ydant/core";
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
    children: UserProfile,
  });
```

### ErrorBoundary

```typescript
import { ErrorBoundary } from "@ydant/async";

const App: Component = () =>
  ErrorBoundary({
    fallback: (error) => text(`Error: ${error.message}`),
    children: () => RiskyComponent(),
  });
```

### Combined Usage

```typescript
const App: Component = () =>
  ErrorBoundary({
    fallback: (error) => text(`Error: ${error.message}`),
    children: () =>
      Suspense({
        fallback: () => text("Loading..."),
        children: AsyncContent,
      }),
  });
```

## API

### Suspense

```typescript
function Suspense(props: SuspenseProps): ElementGenerator;

interface SuspenseProps {
  fallback: () => Render;
  children: Component;
}
```

Shows fallback while async content is loading.

### ErrorBoundary

```typescript
function ErrorBoundary(props: ErrorBoundaryProps): ElementGenerator;

interface ErrorBoundaryProps {
  fallback: (error: Error) => Render;
  children: () => ElementGenerator;
}
```

Catches errors in child components and shows fallback.

### createResource

```typescript
function createResource<T>(fetcher: () => Promise<T>): Resource<T>;

interface Resource<T> {
  (): T; // Throws promise if pending, error if failed
  refetch(): void;
  state: "pending" | "ready" | "error";
}
```

Creates a resource that suspends while loading.

## Module Structure

- `suspense.ts` - Suspense component
- `error-boundary.ts` - ErrorBoundary component
- `resource.ts` - createResource
